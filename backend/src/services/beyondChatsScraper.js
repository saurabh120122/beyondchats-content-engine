import axios from "axios";
import { JSDOM, VirtualConsole } from "jsdom";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Article from "../models/article.js";

dotenv.config();

const BASE_URL = "https://beyondchats.com/blogs/";
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

// Suppress CSS errors
const virtualConsole = new VirtualConsole();
virtualConsole.on("error", () => { /* No-op */ });

async function scrapeBeyondChats() {
  try {
    if (mongoose.connection.readyState === 0) {
        console.log("⏳ Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected.");
    }

    console.log("🔍 Finding the last page number...");
    
    let currentUrl = BASE_URL;
    let lastUrl = currentUrl;
    
    // Phase 1: Find Last Page
    while (true) {
        try {
            const { data } = await axios.get(currentUrl);
            const dom = new JSDOM(data, { virtualConsole });
            const doc = dom.window.document;
            
            const nextLink = [...doc.querySelectorAll("a")].find(
                (a) => a.textContent.trim().toLowerCase() === "next" || a.classList.contains("next")
            );

            if (nextLink && nextLink.href) {
                currentUrl = nextLink.href.startsWith("http") 
                    ? nextLink.href 
                    : new URL(nextLink.href, BASE_URL).toString();
                lastUrl = currentUrl;
                process.stdout.write("."); 
            } else {
                console.log(`\n✅ Last page found: ${lastUrl}`);
                break;
            }
        } catch (err) {
            console.error("\n❌ Navigation error:", err.message);
            break;
        }
    }

    const match = lastUrl.match(/page\/(\d+)/);
    const lastPageNum = match ? parseInt(match[1]) : 1;
    const pagesToScrape = [lastPageNum];
    if (lastPageNum > 1) pagesToScrape.push(lastPageNum - 1);

    console.log(`🎯 Targeting Pages: ${pagesToScrape.join(" & ")}`);

    // Phase 2: Collect Links
    let candidates = [];
    for (const pageNum of pagesToScrape) {
        const url = pageNum === 1 ? BASE_URL : `${BASE_URL}page/${pageNum}/`;
        try {
            const { data } = await axios.get(url);
            const doc = new JSDOM(data, { virtualConsole }).window.document;
            
            const cards = [...doc.querySelectorAll("article, .post, .type-post")];
            
            for (const card of cards) {
                const linkTag = card.querySelector("a");
                const dateTag = card.querySelector("time") || card.querySelector(".date");
                
                if (linkTag && linkTag.href.includes("/blogs/")) {
                    const link = linkTag.href.startsWith("http") ? linkTag.href : new URL(linkTag.href, BASE_URL).toString();
                    let dateObj = new Date(0);
                    if (dateTag) {
                        const dateStr = dateTag.getAttribute("datetime") || dateTag.textContent.trim();
                        if (dateStr) dateObj = new Date(dateStr);
                    }
                    candidates.push({ link, date: dateObj });
                }
            }
        } catch (err) {
            console.error(`   ⚠️ Failed to scan Page ${pageNum}`);
        }
    }

    // Sort & Slice
    const uniqueCandidates = [];
    const seen = new Set();
    for (const c of candidates) {
        if (!seen.has(c.link)) {
            seen.add(c.link);
            uniqueCandidates.push(c);
        }
    }
    uniqueCandidates.sort((a, b) => a.date - b.date);
    const top5 = uniqueCandidates.slice(0, 5);
    
    console.log(`\n📊 Selected ${top5.length} Oldest Articles.`);

    // Phase 3: Scrape & Save
    for (const item of top5) {
        try {
            const { data } = await axios.get(item.link);
            const doc = new JSDOM(data, { virtualConsole }).window.document;

            const title = doc.querySelector("h1")?.textContent?.trim();
            if (!title) continue;

            const contentDiv = doc.querySelector(".entry-content") || doc.querySelector("article");
            const content = contentDiv ? [...contentDiv.querySelectorAll("p")].map(p => p.textContent.trim()).join("\n\n") : "";
            const author = doc.querySelector(".author-name")?.textContent?.trim() || "Unknown";
            
            const pageDateStr = doc.querySelector("time")?.getAttribute("datetime");
            const finalDate = pageDateStr ? new Date(pageDateStr) : item.date;
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

            await Article.updateOne(
                { slug },
                { title, slug, content, author, createdAt: finalDate, sourceUrl: item.link },
                { upsert: true }
            );
            console.log(`   💾 Saved: ${title}`);

        } catch (err) {
            console.error(`   ❌ Error scraping ${item.link}: ${err.message}`);
        }
    }

  } catch (error) {
    console.error("Script failed:", error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        console.log("👋 Disconnected.");
    }
  }
}

// Check if running directly or imported
if (process.argv[1].endsWith('beyondChatsScraper.js')) {
    scrapeBeyondChats();
}