import express from "express";
import {
  getArticles,
  getLatestArticle,
  createArticle
} from "../controllers/articleController.js";

const router = express.Router();

router.get("/", getArticles);
router.get("/latest", getLatestArticle);
router.post("/", createArticle);

export default router;
