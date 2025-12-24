import Article from "../models/article.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import runPipeline from "../pipeline/runPipeline.js";
import { scrapeBeyondChats } from "../services/beyondChatsScraper.js";

export const getArticles = asyncHandler(async (req, res) => {
  const articles = await Article.find().sort({ createdAt: -1 });
  res.json(articles);
});

export const getLatestArticle = asyncHandler(async (req, res) => {
  const article = await Article.findOne().sort({ createdAt: -1 });
  if (!article) {
      throw new ApiError(404, "No articles found");
  }
  res.json(article);
});

export const createArticle = asyncHandler(async (req, res) => {
  if (!req.body.title) {
      throw new ApiError(400, "Title is required");
  }
  const article = await Article.create(req.body);
  res.status(201).json(article);
});

export const triggerPipeline = asyncHandler(async (req, res) => {
  console.log("⚡ API Trigger: Starting AI Pipeline...");
  
  await runPipeline();

  res.status(200).json({ 
    success: true, 
    message: "Pipeline executed successfully! New article created." 
  });
});

export const triggerScraper = asyncHandler(async (req, res) => {
  console.log("⚡ API Trigger: Starting Scraper...");
  
  try {
    await scrapeBeyondChats(false); 
    
    res.status(200).json({ 
        success: true, 
        message: "Scraping completed! 5 oldest articles updated." 
    });
  } catch (error) {
    console.error("Scraper Error:", error);
    throw new ApiError(500, "Scraping Failed: " + error.message);
  }
});

export const deleteArticle = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);
  
  if (!article) {
    throw new ApiError(404, "Article not found");
  }

  await article.deleteOne();
  res.status(200).json({ success: true, message: "Article deleted" });
});


export const deleteAllArticles = asyncHandler(async (req, res) => {
  await Article.deleteMany({});
  res.status(200).json({ success: true, message: "All articles deleted" });
});