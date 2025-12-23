import axios from "axios";
import { JSDOM, VirtualConsole } from "jsdom";
import { Readability } from "@mozilla/readability";

// Suppress CSS parsing errors
const virtualConsole = new VirtualConsole();
virtualConsole.on("error", () => { /* No-op */ });

export async function extractContent(url) {
  try {
    const { data } = await axios.get(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' 
      },
      timeout: 10000 
    });
    
    const dom = new JSDOM(data, { url, virtualConsole });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    return article ? article.textContent : null;

  } catch (error) {
    // Return null on failure so pipeline can skip to next link
    return null;
  }
}