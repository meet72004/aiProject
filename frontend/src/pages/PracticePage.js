import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api";
import AppHeader from "../components/AppHeader";
import "./SharedPage.css";

export default function PracticePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentDescriptive, setCurrentDescriptive] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  const loadNextDescriptive = async () => {
    setSaved(false);
    try {
      const res = await axios.get(`/next-question/${currentIndex}`);
      if (res.data.message === "No more questions") {
        setCurrentDescriptive(null);
        alert("No more descriptive questions.");
        return;
      }
      setCurrentDescriptive(res.data);
      setCurrentIndex((prev) => prev + 1);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Generate questions first, then try again.");
    }
  };

  const saveCurrentQuestion = async () => {
    if (!currentDescriptive || saving || saved) return;
    setSaving(true);
    try {
      await axios.post("/saved-questions", {
        question: currentDescriptive.question,
        answer: currentDescriptive.answer,
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="shared-page">
      <AppHeader />
      <header className="shared-header">
        <button type="button" className="shared-back" onClick={() => navigate("/choose")}>
          ← Back
        </button>
        <h1 className="shared-title">Descriptive Practice</h1>
        <p className="shared-subtitle">
          Step through descriptive questions one by one for voice or written practice.
        </p>
      </header>

      <section className="shared-card">
        <button
          type="button"
          className="shared-btn shared-btn--primary"
          onClick={loadNextDescriptive}
        >
          Next question
        </button>

        {currentDescriptive && (
          <div className="shared-content descriptive-box">
            <h3>Question</h3>
            <p>{currentDescriptive.question}</p>
            <h4>Answer (for reference)</h4>
            <p>{currentDescriptive.answer}</p>
            <button
              type="button"
              className="shared-btn generate-save-btn"
              onClick={saveCurrentQuestion}
              disabled={saving || saved}
            >
              {saved ? "Saved to Dashboard" : saving ? "Saving…" : "Save to Dashboard"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
