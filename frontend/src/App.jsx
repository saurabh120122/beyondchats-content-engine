import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import { Sparkles, X, Loader2, Calendar, RefreshCw, Trash2, Trash } from "lucide-react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050/api/articles";

function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);

  // Fetch Articles
  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      setArticles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArticles(); }, []);

  // --- ACTIONS ---

  const handleScrape = async () => {
    setScraping(true);
    try {
      await axios.post(`${API_URL}/scrape`);
      alert("✅ Scraping Complete!");
      fetchArticles();
    } catch (err) {
      alert("Scraping failed.");
    } finally {
      setScraping(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await axios.post(`${API_URL}/pipeline`);
      alert("✨ New AI Article Created!");
      fetchArticles(); 
    } catch (err) {
      const msg = err.response?.data?.message || "Error generating article.";
      alert(msg);
    } finally {
      setGenerating(false);
    }
  };

  // NEW: Delete Single Article
  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent opening the modal when clicking delete
    if (!window.confirm("Are you sure you want to delete this article?")) return;

    try {
      await axios.delete(`${API_URL}/${id}`);
      setArticles(articles.filter(a => a._id !== id)); // Optimistic update
    } catch (err) {
      alert("Failed to delete article");
    }
  };

  // NEW: Delete ALL Articles
  const handleDeleteAll = async () => {
    if (!window.confirm("⚠️ WARNING: This will delete ALL articles! Are you sure?")) return;
    
    try {
      await axios.delete(`${API_URL}/all`);
      setArticles([]); // Clear list immediately
    } catch (err) {
      alert("Failed to delete all articles");
    }
  };

  const renderContent = (article) => {
      return <div dangerouslySetInnerHTML={{ __html: article.content }} />;
  };

  return (
    <div className="container">
      <header>
        <div>
          <h1>BeyondChats Blog Engine</h1>
          <p style={{ color: "var(--text-muted)" }}>{articles.length} articles available</p>
        </div>
        
        <div style={{ display: "flex", gap: "1rem" }}>
            {/* Delete All Button */}
            {articles.length > 0 && (
              <button 
                className="btn" 
                style={{ backgroundColor: "#ef4444", color: "white" }}
                onClick={handleDeleteAll}
              >
                <Trash2 size={20} /> Delete All
              </button>
            )}

            <button 
              className="btn" 
              style={{ backgroundColor: "#0f172a", color: "white" }}
              onClick={handleScrape} 
              disabled={scraping || generating}
            >
              {scraping ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
              {scraping ? "Scraping..." : "Scrape 5 Blogs"}
            </button>

            <button 
              className="btn btn-primary" 
              onClick={handleGenerate} 
              disabled={generating || scraping}
            >
              {generating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
              {generating ? "Enhancing..." : "Add AI Blog"}
            </button>
        </div>
      </header>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>Loading...</div>
      ) : (
        <div className="grid">
          {articles.map((article, index) => (
            <div 
              key={article._id} 
              className="card" 
              onClick={() => setSelectedArticle(article)}
              style={{ position: "relative" }}
            >
              {/* Delete Icon Button */}
              <button 
                className="delete-icon-btn"
                onClick={(e) => handleDelete(e, article._id)}
                title="Delete Article"
              >
                <Trash size={16} />
              </button>

              <div>
                {/* ID MAPPING: Show #1, #2, #3 based on index */}
                <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginBottom: "0.5rem", fontWeight: "bold" }}>
                   #{articles.length - index} 
                </div>

                {article.title.includes("(AI Enhanced)") && <span className="tag">✨ AI Enhanced</span>}
                <h3>{article.title}</h3>
              </div>
              <div className="date">
                <Calendar size={14} style={{ marginRight: "5px" }} />
                {article.createdAt ? format(new Date(article.createdAt), "MMM dd, yyyy") : "Unknown Date"}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedArticle && (
        <div className="modal-overlay" onClick={() => setSelectedArticle(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedArticle.title}</h2>
              <button className="close-btn" onClick={() => setSelectedArticle(null)}><X size={24} /></button>
            </div>
            <div className="modal-body">
               {renderContent(selectedArticle)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;