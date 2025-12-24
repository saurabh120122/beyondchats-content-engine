import axios from "axios";
import { JSDOM, VirtualConsole } from "jsdom";
import { Readability } from "@mozilla/readability";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Article from "../models/article.js";

dotenv.config();

const BASE_URL = "https://beyondchats.com/blogs/";
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const virtualConsole = new VirtualConsole();
virtualConsole.on("error", () => { /* No-op */ });

export async function scrapeBeyondChats(isScript = false) {
  // TRACKING: Did we start the connection, or was it already open?
  const wasAlreadyConnected = mongoose.connection.readyState === 1;

  try {
    // 1. Connect ONLY if not already connected
    if (!wasAlreadyConnected) {
        console.log("⏳ Scraper connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Scraper Connected.");
    }

    console.log("🔍 Finding the last page number...");
    
    // --- Scraper Logic (No changes here, same as before) ---
    let currentUrl = BASE_URL;
    let lastUrl = currentUrl;
    
    // Phase 1: Pagination
    while (true) {
        try {
            const { data } = await axios.get(currentUrl);
            const dom = new JSDOM(data, { virtualConsole });
            const doc = dom.window.document;
            const nextLink = [...doc.querySelectorAll("a")].find(
                (a) => a.textContent.trim().toLowerCase() === "next" || a.classList.contains("next")
            );
            if (nextLink && nextLink.href) {
                currentUrl = nextLink.href.startsWith("http") ? nextLink.href : new URL(nextLink.href, BASE_URL).toString();
                lastUrl = currentUrl;
            } else { break; }
        } catch (err) { break; }
    }

    const match = lastUrl.match(/page\/(\d+)/);
    const lastPageNum = match ? parseInt(match[1]) : 1;
    const pagesToScrape = [lastPageNum];
    if (lastPageNum > 1) pagesToScrape.push(lastPageNum - 1);

    // Phase 2: Links
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
        } catch (err) {}
    }

    // Phase 3: Sort
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

    // Phase 4: Save
    for (const item of top5) {
        try {
            const { data } = await axios.get(item.link);
            const dom = new JSDOM(data, { url: item.link, virtualConsole });
            const reader = new Readability(dom.window.document);
            const article = reader.parse();

            if (!article) continue;

            const content = article.content || ""; 
            const title = article.title || "Untitled";
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            const author = article.byline || "Unknown";
            const finalDate = item.date.getTime() === 0 ? new Date() : item.date;

            await Article.updateOne(
                { slug },
                { title, slug, content, author, createdAt: finalDate, sourceUrl: item.link },
                { upsert: true }
            );
            console.log(`   💾 Saved: "${title}"`);
        } catch (err) {}
    }

  } catch (error) {
    console.error("Script failed:", error);
    throw error;
  } finally {
    // ✅ SAFE DISCONNECT LOGIC:
    // Only disconnect if WE started the connection (i.e., running as script).
    // If the Server (wasAlreadyConnected) called us, DO NOT disconnect.
    if (!wasAlreadyConnected && mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        console.log("👋 Scraper Disconnected (Script Mode).");
    } else {
        console.log("ℹ️ Keeping Database Connection Open (Server Mode).");
    }
  }
}

if (process.argv[1].endsWith('beyondChatsScraper.js')) {
    scrapeBeyondChats(true);
}