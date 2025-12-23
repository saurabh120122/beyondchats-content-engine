import mongoose from "mongoose";

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true },
    content: String,
    sourceUrl: String,
    references: [String]
  },
  { timestamps: true }
);

export default mongoose.model("Article", articleSchema);
