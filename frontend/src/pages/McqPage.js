import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api";
import AppHeader from "../components/AppHeader";
import "./SharedPage.css";

const MCQ_LEVELS = [
  { value: "", label: "Any" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export default function McqPage() {
  const [mcqs, setMcqs] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [isLoadingMcq, setIsLoadingMcq] = useState(false);
  const [moreMcqLevel, setMoreMcqLevel] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const navigate = useNavigate();

  const loadMcq = async () => {
    try {
      setIsLoadingMcq(true);
      setQuizResult(null);
      const res = await axios.get("/mcq");
      const list = res.data.mcq || [];
      setMcqs(list);
      setUserAnswers({});
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Generate questions first, then try again.");
    } finally {
      setIsLoadingMcq(false);
    }
  };

  const loadMoreMcq = async () => {
    try {
      setIsLoadingMore(true);
      setQuizResult(null);
      const url = moreMcqLevel ? `/ai-more-mcq?level=${encodeURIComponent(moreMcqLevel)}` : "/ai-more-mcq";
      const res = await axios.get(url);
      setMcqs(res.data.mcq || []);
      setUserAnswers({});
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "Failed to get more MCQs. Generate questions first.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleOptionChange = (qIndex, option) => {
    setUserAnswers((prev) => ({ ...prev, [qIndex]: option }));
  };

  const submitMcq = async () => {
    if (!mcqs.length) {
      alert("Load the quiz first.");
      return;
    }
    const answersArray = mcqs.map((_, index) => userAnswers[index] || "");
    try {
      const res = await axios.post("/submit-mcq", { answers: answersArray });
      setQuizResult(res.data);
    } catch (error) {
      console.error(error);
      alert("Failed to submit.");
    }
  };

  return (
    <div className="shared-page">
      <AppHeader />
      <header className="shared-header">
        <button type="button" className="shared-back" onClick={() => navigate("/choose")}>
          ← Back
        </button>
        <h1 className="shared-title">MCQ Quiz</h1>
        <p className="shared-subtitle">
          Load the generated MCQs, answer them, and submit to see your score.
        </p>
      </header>

      <section className="shared-card">
        <button
          type="button"
          className="shared-btn shared-btn--primary"
          onClick={loadMcq}
          disabled={isLoadingMcq}
        >
          {isLoadingMcq ? "Loading…" : "Load MCQ Quiz"}
        </button>

        {mcqs.length > 0 && (
          <div className="shared-content mcq-content">
            <div className="mcq-more-bar">
              <label className="generate-level-label">
                <span>More MCQs difficulty:</span>
                <select
                  className="generate-level-select"
                  value={moreMcqLevel}
                  onChange={(e) => setMoreMcqLevel(e.target.value)}
                >
                  {MCQ_LEVELS.map((opt) => (
                    <option key={opt.value || "any"} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="shared-btn generate-more-btn"
                onClick={loadMoreMcq}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? "Loading…" : "Get more MCQs"}
              </button>
            </div>
            {mcqs.map((q, qIndex) => (
              <div key={qIndex} className="mcq-item">
                <p className="mcq-question">
                  <strong>Q{qIndex + 1}:</strong> {q.question}
                </p>
                <div className="mcq-options">
                  {(q.options || []).map((opt, optIndex) => (
                    <label key={optIndex} className="mcq-option">
                      <input
                        type="radio"
                        name={`q-${qIndex}`}
                        value={opt}
                        checked={userAnswers[qIndex] === opt}
                        onChange={() => handleOptionChange(qIndex, opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button type="button" className="shared-btn submit-btn" onClick={submitMcq}>
              Submit Answers
            </button>
          </div>
        )}

        {quizResult && (
          <div className="quiz-result">
            <h3>Your score: {quizResult.score} / {quizResult.totalQuestions}</h3>
          </div>
        )}
      </section>
    </div>
  );
}
