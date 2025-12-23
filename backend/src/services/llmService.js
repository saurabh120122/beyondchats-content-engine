import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function rewriteArticle(original, ref1, ref2) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Safety: Ensure strings
    const safeOriginal = (original || "").substring(0, 5000);
    const safeRef1 = (ref1 || "").substring(0, 4000);
    const safeRef2 = (ref2 || "").substring(0, 4000);

    const prompt = `
      You are an expert SEO content editor. 
      Rewrite the following draft article using the provided research materials.
      
      Goals:
      1. Improve clarity, depth, and flow.
      2. Use HTML tags for formatting (<h2>, <p>, <ul>, <strong>).
      3. Do NOT include markdown code blocks. Just return the raw HTML body.
      4. Maintain the core message of the original draft.
      
      Draft:
      "${safeOriginal}"
      
      Research 1:
      "${safeRef1}"
      
      Research 2:
      "${safeRef2}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean Markdown
    text = text.replace(/^```html/, '').replace(/```$/, '').trim();
    
    if (!text || text.length < 50) {
        throw new Error("LLM returned empty response");
    }

    return text;

  } catch (error) {
    throw new Error(`LLM Generation Failed: ${error.message}`);
  }
}