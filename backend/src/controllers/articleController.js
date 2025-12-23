import Article from "../models/article.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

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