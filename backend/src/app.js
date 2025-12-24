import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import articleRoutes from "./routes/articleRoutes.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import cors from "cors";
dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/articles", articleRoutes);

// Error Middleware must be the last app.use()
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);