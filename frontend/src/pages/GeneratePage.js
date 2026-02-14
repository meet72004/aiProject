import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api";
import AppHeader from "../components/AppHeader";
import "./SharedPage.css";

const LEVELS = [
  { value: "", label: "Any" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export default function GeneratePage() {
  const [level, setLevel] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState(null);
  const [genError, setGenError] = useState("");
  const [savedIds, setSavedIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);
  const navigate = useNavigate();

  const saveQuestion = async (index) => {
    const q = questions?.descriptive?.[index];
    if (!q || savedIds.has(index)) return;
    setSavingId(index);
    try {
      await axios.post("/saved-questions", { question: q.question, answer: q.answer });
      setSavedIds((prev) => new Set(prev).add(index));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to save");
    } finally {
      setSavingId(null);
    }
  };

  const generateQuestions = async (isNewSet = false) => {
    try {
      setIsGenerating(true);
      if (!isNewSet) setGenError("");
      const url = level ? `/ai-questions?level=${encodeURIComponent(level)}` : "/ai-questions";
      const res = await axios.get(url);
      setQuestions(res.data);
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || error.response?.data?.error;
      setGenError(msg || "Failed to generate questions. Upload material first.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="shared-page">
      <AppHeader />
      <header className="shared-header">
        <button type="button" className="shared-back" onClick={() => navigate("/choose")}>
          ← Back
        </button>
        <h1 className="shared-title">Generate Questions</h1>
        <p className="shared-subtitle">
          AI will create descriptive and multiple choice questions from your material.
        </p>
      </header>

      <section className="shared-card">
        <div className="generate-controls">
          <label className="generate-level-label">
            <span>Difficulty:</span>
            <select
              className="generate-level-select"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              {LEVELS.map((opt) => (
                <option key={opt.value || "any"} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="shared-btn shared-btn--primary"
            onClick={() => generateQuestions(false)}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating…" : "Generate Questions"}
          </button>
        </div>

        {genError && <p className="shared-error">{genError}</p>}

        {questions && (
          <div className="shared-content">
            {questions._limits && (
              <p className="shared-limits">
                Used {questions._limits.sentToAiLength?.toLocaleString() ?? "—"} of{" "}
                {questions._limits.extractedLength?.toLocaleString() ?? "—"} extracted characters for AI
                (max {questions._limits.maxTextForAi?.toLocaleString() ?? "—"}).
                {questions._limits.truncated ? " Long document was trimmed to max." : " Full document used."}
              </p>
            )}
            <h3>Descriptive questions (preview)</h3>
            <p className="shared-hint" style={{ marginTop: 0 }}>Save any question to your Dashboard (profile → Dashboard).</p>
            <div className="generate-questions-list">
              {(questions.descriptive || []).map((q, index) => (
                <div key={index} className="generate-question-item">
                  <div className="generate-question-text">
                    <strong>Q{index + 1}:</strong> {q.question}
                    <div className="generate-answer-text"><strong>Answer:</strong> {q.answer}</div>
                  </div>
                  <button
                    type="button"
                    className="generate-save-btn"
                    onClick={() => saveQuestion(index)}
                    disabled={savedIds.has(index) || savingId !== null}
                  >
                    {savedIds.has(index) ? "Saved" : savingId === index ? "Saving…" : "Save"}
                  </button>
                </div>
              ))}
            </div>
            <div className="generate-more-row">
              <button
                type="button"
                className="shared-btn generate-more-btn"
                onClick={() => generateQuestions(true)}
                disabled={isGenerating}
              >
                {isGenerating ? "Generating…" : "Generate new questions"}
              </button>
            </div>
            <p className="shared-hint">You can now try MCQ Quiz or Descriptive Practice from the home options.</p>
          </div>
        )}
      </section>
    </div>
  );
}
