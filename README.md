# 🚀 BeyondChats Content Engine

A robust Node.js automation engine that scrapes blog content, enhances it using AI (Google Gemini), and publishes it via a RESTful API.

## 📋 Overview

This project consists of two main automated workflows:

1. **Phase 1 (Scraper):** Crawls the *BeyondChats* blog to find and store the 5 oldest articles.
2. **Phase 2 (AI Pipeline):** Takes the latest stored article, researches related high-ranking content on Google, and uses an LLM (Google Gemini) to rewrite and enhance the article with improved formatting and citations.

## ✨ Features

* **Smart Pagination:** Automatically traverses blog pagination to find the oldest content.
* **Fail-Fast Architecture:** The pipeline aborts immediately if data is missing or scraping fails, preventing bad data from entering the database.
* **AI-Powered Rewriting:** Uses **Google Gemini 1.5/Pro** to rewrite content with HTML formatting.
* **Research Automation:** Searches Google Custom Search API to find relevant reference material.
* **Robust Scraping:** Uses `@mozilla/readability` and `JSDOM` with `VirtualConsole` to parse external websites cleanly.
* **Error Handling:** Centralized `ApiError` and `asyncHandler` for clean controller logic.

## 🛠️ Tech Stack

* **Runtime:** Node.js
* **Database:** MongoDB (Mongoose)
* **AI Model:** Google Gemini (via `@google/generative-ai`)
* **Scraping:** JSDOM, Mozilla Readability, Axios
* **Search:** Google Custom Search JSON API

## ⚙️ Prerequisites

Before running the project, ensure you have:

1. **Node.js** (v18+ recommended)
2. **MongoDB** (Local or Atlas URL)
3. **API Keys**:
* **Google Custom Search API Key** (for searching the web)
* **Google CSE ID** (Custom Search Engine ID)
* **Google Gemini API Key** (for AI generation)



## 🚀 Installation & Setup

1. **Clone the repository** (if applicable) or navigate to your project folder.
2. **Install Dependencies**
```bash
npm install

```


3. **Configure Environment Variables**
Create a `.env` file in the root directory and add the following:
```env
PORT=5050
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/beyondchats

# Google Search Config
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_CSE_ID=your_cse_id_here

# AI Config
GEMINI_API_KEY=your_gemini_api_key_here

```



## 🏃‍♂️ How to Run

### 1. Start the API Server

This keeps your REST API running so you can access the data via browser or Postman.

```bash
npm run dev
# OR
node src/app.js

```

* Server runs at: `http://localhost:5050`

### 2. Run the Automation Workflow

This runs **Phase 1** (Scraping) followed immediately by **Phase 2** (AI Enhancement).

```bash
node src/runFullWorkflow.js

```

**What happens when you run this?**

1. **Scraper** connects to MongoDB.
2. It traverses `beyondchats.com` to find the last page.
3. It saves the 5 oldest articles to the database.
4. **Pipeline** picks the latest article from the DB.
5. It searches Google for that title.
6. It scrapes 2 valid external sources for context.
7. It uses Gemini to rewrite the article.
8. It saves a **new** article (Total DB count: 6).

## 📂 Project Structure

```
src/
├── config/
│   └── db.js                 # MongoDB Connection logic
├── controllers/
│   └── articleController.js  # API logic (get, create)
├── middlewares/
│   └── errorMiddleware.js    # Global error handling
├── models/
│   └── article.js            # Mongoose Schema
├── pipeline/
│   └── runPipeline.js        # Phase 2: AI Enhancement Logic
├── routes/
│   └── articleRoutes.js      # Express Routes
├── services/
│   ├── beyondChatsScraper.js # Phase 1: Blog Scraper
│   ├── googleSearchService.js# Google API integration
│   ├── llmService.js         # Gemini AI integration
│   └── scraperService.js     # Generic JSDOM/Readability scraper
├── utils/
│   ├── ApiError.js           # Custom Error Class
│   └── asyncHandler.js       # Wrapper for async controllers
├── app.js                    # Main Express App
└── runFullWorkflow.js        # Master script to run everything

```

## 📡 API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/articles` | Fetch all articles (sorted by newest) |
| `GET` | `/api/articles/latest` | Fetch the single latest article |
| `POST` | `/api/articles` | Manually create a new article |

## 🛡️ Troubleshooting

* **429 Quota Exceeded:** Your OpenAI/Gemini free tier might be exhausted. The code is currently set to use `gemini-pro` (free tier friendly).
* **403 Forbidden (Scraping):** Some sites (like Reddit) block scrapers. The pipeline is designed to skip these and try the next available link from Google results.
