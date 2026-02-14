import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api";
import AppHeader from "../components/AppHeader";
import "./DashboardPage.css";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadSaved();
  }, []);

  const loadSaved = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get("/saved-questions");
      setSaved(res.data.saved || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to load saved questions");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this question from your dashboard?")) return;
    try {
      await axios.delete(`/saved-questions/${id}`);
      setSaved((prev) => prev.filter((q) => q._id !== id));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to delete");
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const res = await axios.get("/saved-questions/export-pdf", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `saved-questions-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <AppHeader />
      <div className="dashboard-content">
        <header className="dashboard-header">
          <button type="button" className="shared-back" onClick={() => navigate("/choose")}>
            ← Back
          </button>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            Your saved questions and answers. Download as PDF to keep a copy.
          </p>
          {saved.length > 0 && (
            <button
              type="button"
              className="dashboard-download-btn"
              onClick={handleDownloadPdf}
              disabled={downloading}
            >
              {downloading ? "Preparing…" : "Download as PDF"}
            </button>
          )}
        </header>

        {loading && <p className="dashboard-loading">Loading…</p>}
        {error && <p className="dashboard-error">{error}</p>}

        {!loading && !error && saved.length === 0 && (
          <div className="dashboard-empty">
            <p>No saved questions yet.</p>
            <p className="dashboard-empty-hint">
              Generate questions, then use &quot;Save&quot; on any question to add it here.
            </p>
          </div>
        )}

        {!loading && saved.length > 0 && (
          <div className="dashboard-list">
            {saved.map((item, index) => (
              <div key={item._id} className="dashboard-card">
                <div className="dashboard-card-body">
                  <h3 className="dashboard-card-q">Q{index + 1}: {item.question}</h3>
                  <p className="dashboard-card-a">{item.answer}</p>
                </div>
                <button
                  type="button"
                  className="dashboard-card-remove"
                  onClick={() => handleDelete(item._id)}
                  title="Remove from dashboard"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
