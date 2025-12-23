import axios from "axios";

export async function searchGoogle(query) {
  try {
    const res = await axios.get(
      "https://www.googleapis.com/customsearch/v1",
      {
        params: {
          q: query,
          key: process.env.GOOGLE_API_KEY,
          cx: process.env.GOOGLE_CSE_ID,
          num: 10 // Fetch 10 to ensure we find 2 valid ones
        }
      }
    );

    return (res.data.items || [])
      .map(item => item.link)
      .filter(link => link); 
      
  } catch (error) {
    console.error("Google Search Error:", error.message);
    return [];
  }
}