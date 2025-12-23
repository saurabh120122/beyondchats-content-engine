import mongoose from "mongoose";
import dotenv from "dotenv";
import Article from "../models/article.js";
import { searchGoogle } from "../services/googleSearchService.js";
import { extractContent } from "../services/ScraperService.js";
import { rewriteArticle } from "../services/llmService.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

export default async function runPipeline() {
  try {
    if (mongoose.connection.readyState === 0) {
      console.log("⏳ Connecting to MongoDB...");
      await mongoose.connect(MONGO_URI);
      console.log("✅ Connected.");
    }

    // 1. Fetch Latest
    const article = await Article.findOne().sort({ createdAt: -1 });
    if (!article) throw new Error("No articles found in DB.");
    
    if (article.title.includes("(AI Enhanced)")) {
         throw new Error("Latest article is already AI enhanced. Stopping.");
    }

    console.log(`📄 Enhancing: "${article.title}"`);

    // 2. Search Google
    console.log("🌐 Searching Google...");
    const allLinks = await searchGoogle(article.title);
    
    if (!allLinks || allLinks.length === 0) {
        throw new Error("Google Search returned 0 results.");
    }

    // 3. Scrape Loop
    console.log(`🔍 Found ${allLinks.length} links. Need 2 valid sources...`);
    const validSources = [];
    
    for (const link of allLinks) {
        if (validSources.length >= 2) break;
        if (link.includes("beyondchats.com")) continue;

        try {
            console.log(`   Trying: ${link}`);
            const content = await extractContent(link);

            if (content && content.length > 500) {
                console.log("   ✅ Success!");
                validSources.push({ link, content });
            } else {
                console.log("   ⚠️ Skipped (Content too short)");
            }
        } catch (err) {
            console.log(`   ❌ Failed: ${err.message}`);
        }
    }

    if (validSources.length < 2) {
        throw new Error(`Pipeline Failed: Found ${validSources.length}/2 valid sources.`);
    }

    // 4. Generate AI Content
    console.log("🤖 Generating new content...");
    const updatedContent = await rewriteArticle(
        article.content || "", 
        validSources[0].content, 
        validSources[1].content
    );

    // 5. Save New Article
    console.log("💾 Saving...");
    const usedLinks = validSources.map(s => s.link);
    
    const referencesHtml = `
      <hr>
      <h3>References</h3>
      <ul>
        ${usedLinks.map(link => `<li><a href="${link}" target="_blank">${link}</a></li>`).join('')}
      </ul>
    `;

    const newArticle = new Article({
      title: article.title + " (AI Enhanced)", 
      slug: article.slug + "-ai-enhanced-" + Date.now(),
      content: updatedContent + referencesHtml,
      sourceUrl: article.sourceUrl,
      references: usedLinks,
      createdAt: new Date() 
    });

    await newArticle.save();
    console.log("✅ SUCCESS: Phase 2 Completed.");

  } catch (error) {
    console.error("\n❌ ABORTING PIPELINE:", error.message);
    console.error("⛔ No changes made to DB.");
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected.");
    process.exit(0);
  }
}

if (process.argv[1].endsWith('runPipeline.js')) {
    runPipeline();
}