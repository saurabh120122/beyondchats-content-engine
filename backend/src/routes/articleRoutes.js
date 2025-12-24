import express from "express";
import {
  getArticles,
  getLatestArticle,
  createArticle,
  triggerPipeline,
  triggerScraper,
  deleteArticle,    
  deleteAllArticles
} from "../controllers/articleController.js";

const router = express.Router();

router.get("/", getArticles);
router.get("/latest", getLatestArticle);
router.post("/", createArticle);
router.post("/pipeline", triggerPipeline);
router.post("/scrape", triggerScraper);
router.delete("/all", deleteAllArticles); 
router.delete("/:id", deleteArticle);
export default router;
