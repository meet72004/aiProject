import { useState, useEffect } from "react";
import axios from "../api";
import AppHeader from "../components/AppHeader";
import "./ApiKeyPage.css";

export default function ApiKeyPage() {
  const [apiKey, setApiKey] = useState("");
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/settings/gemini-key");
      setConfigured(!!res.data.configured);
    } catch (err) {
      setConfigured(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setMessage({ type: "error", text: "Please paste your API key." });
      return;
    }
    setMessage({ type: "", text: "" });
    setSaving(true);
    try {
      await axios.post("/settings/gemini-key", { apiKey: trimmed });
      setApiKey("");
      setConfigured(true);
      setMessage({ type: "success", text: "API key updated. You can generate questions again." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to save API key.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="apikey-page">
      <AppHeader />
      <div className="apikey-content">
        <div className="apikey-card">
          <h1 className="apikey-title">Renew API key</h1>
          <p className="apikey-desc">
            When your Gemini quota or tokens run out, paste a new API key here to continue generating questions.
            Get a key from{" "}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
              Google AI Studio
            </a>.
          </p>
          {loading ? (
            <p className="apikey-status">Checking status…</p>
          ) : (
            <p className={`apikey-status apikey-status--${configured ? "ok" : "warn"}`}>
              {configured ? "✓ API key is set. You can update it below." : "No API key set yet, or quota may be exhausted. Add or replace your key below."}
            </p>
          )}
          <form onSubmit={handleSubmit} className="apikey-form">
            <input
              type="password"
              className="apikey-input"
              placeholder="Paste your Gemini API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
              disabled={saving}
            />
            <button type="submit" className="apikey-submit" disabled={saving}>
              {saving ? "Saving…" : "Save API key"}
            </button>
          </form>
          {message.text && (
            <p className={`apikey-message apikey-message--${message.type}`}>
              {message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
