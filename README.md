# 🚀 BeyondChats Content Engine (Full Stack)

A powerful automation engine that scrapes blog content, enhances it using Google Gemini AI, and serves it via a React dashboard. The system is designed to be "Fail-Fast" and robust, ensuring high-quality content generation with zero manual intervention.

## 🌐 Live Demo

* **Frontend (Vercel):** [https://beyondchats-content-engine.vercel.app/](https://beyondchats-content-engine.vercel.app/)
* **Backend API (Render):** [https://beyondchats-content-engine.onrender.com/api/articles](https://www.google.com/search?q=https://beyondchats-content-engine.onrender.com/api/articles)

---

## ✨ Features

### 🧠 AI & Automation

* **Smart Scraping:** Crawls *BeyondChats.com* to identify and extract the 5 oldest blog posts using `Mozilla Readability` for clean HTML extraction.
* **AI Enhancement:** Uses **Google Gemini Pro** to rewrite articles, adding professional formatting, depth, and citations.
* **Research Automation:** Automatically searches Google (Custom Search API) to find relevant, high-quality reference links for every article.

### 💻 User Interface (React)

* **Interactive Dashboard:** View original vs. AI-enhanced articles side-by-side.
* **Manual Triggers:** Buttons to trigger the Scraper or AI Pipeline on demand.
* **Content Management:** Delete specific articles or wipe the entire database with one click.
* **Smart Rendering:** Automatically detects and formats HTML content vs. plain text.

### ⚙️ Backend Architecture

* **Fail-Fast Pipeline:** The AI workflow aborts immediately if data is missing or scraping fails, preventing database corruption.
* **Robust Error Handling:** Centralized `ApiError` and `asyncHandler` logic.
* **Connection Management:** Smart MongoDB connection handling that works for both standalone scripts and API requests.

---

## 📂 Project Structure

```text
root/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── config/          # DB Connection
│   │   ├── controllers/     # API Logic (get, delete, trigger)
│   │   ├── middlewares/     # Error Handling & CORS
│   │   ├── models/          # Mongoose Schemas
│   │   ├── pipeline/        # AI Workflow (runPipeline.js)
│   │   ├── routes/          # API Routes
│   │   ├── services/        # Scraper, Google Search, Gemini LLM
│   │   ├── utils/           # AsyncWrapper, ApiError Class
│   │   └── app.js           # Entry Point
│   └── package.json
│
└── frontend/                # React + Vite
    ├── src/
    │   ├── App.jsx          # Main Dashboard Logic
    │   ├── App.css          # Styling & layout
    │   └── main.jsx         # React Entry
    └── package.json

```

---

## 🛠️ Workflows Explained

### 1. The Scraper Workflow (`POST /api/articles/scrape`)

1. Connects to MongoDB (preserves connection if server is running).
2. Crawls `beyondchats.com/blogs/` to find the last pagination page.
3. Identifies the 5 oldest articles.
4. Uses `JSDOM` + `Readability` to extract the main content (ignoring sidebars/footers).
5. Updates or Inserts them into the database.

### 2. The AI Pipeline Workflow (`POST /api/articles/pipeline`)

1. Selects the **latest non-enhanced** article from the DB.
2. Searches Google for the article title to find external context.
3. Scrapes the top 2 valid search results (skipping blocked sites like Reddit).
4. Sends the Draft + 2 Research Sources to **Google Gemini**.
5. Gemini rewrites the article in HTML format.
6. Saves the new version as `Title (AI Enhanced)`.

---

## 🚀 Getting Started

### Prerequisites

* Node.js (v18+)
* MongoDB (Atlas or Local)
* Google Cloud Console Account (for Custom Search & Gemini API)

### 1. Environment Variables

Create a `.env` file in the **`backend/`** folder:

```env
PORT=5050
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/beyondchats
GOOGLE_API_KEY=your_google_search_api_key
GOOGLE_CSE_ID=your_custom_search_engine_id
GEMINI_API_KEY=your_gemini_api_key

```

Create a `.env` file in the **`frontend/`** folder:

```env
VITE_API_URL=http://localhost:5050/api/articles
# For production: https://your-backend.onrender.com/api/articles

```

### 2. Installation

**Backend:**

```bash
cd backend
npm install
npm run dev

```

**Frontend:**

```bash
cd frontend
npm install
npm run dev

```

Visit `http://localhost:5173` to view the app.

---

## 📡 API Reference

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/articles` | Fetch all articles (sorted by newest) |
| `POST` | `/api/articles/scrape` | Trigger the Scraper (Fetch 5 oldest blogs) |
| `POST` | `/api/articles/pipeline` | Trigger AI Enhancement for one article |
| `DELETE` | `/api/articles/:id` | Delete a specific article by ID |
| `DELETE` | `/api/articles/all` | **DANGER:** Delete ALL articles |

---

## ☁️ Deployment Guide

### Backend (Render)

1. Push code to GitHub.
2. Create a **Web Service** on Render.
3. Root Directory: `backend`.
4. Build Command: `npm install`.
5. Start Command: `node src/app.js`.
6. Add Environment Variables from your `.env`.

### Frontend (Vercel)

1. Import Repo to Vercel.
2. Root Directory: `frontend`.
3. Add Environment Variable:
* `VITE_API_URL`: `https://your-render-backend.onrender.com/api/articles`


4. Deploy!

---

## 🛡️ Troubleshooting

* **"Refused to connect"**: Ensure your frontend `.env` points to the correct backend URL (http vs https).
* **Backend Sleeps**: On Render Free Tier, the first request after inactivity takes ~50s.
* **Scraping Errors**: If `beyondchats.com` changes its layout, update selectors in `beyondChatsScraper.js`.
