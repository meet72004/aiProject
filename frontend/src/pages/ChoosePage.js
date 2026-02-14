import { useNavigate, useLocation } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import "./ChoosePage.css";

const OPTIONS = [
  {
    id: "generate",
    title: "Generate Questions",
    description: "Use AI to create descriptive and multiple choice questions from your material.",
    path: "/generate",
    icon: "✨",
  },
  {
    id: "mcq",
    title: "MCQ Quiz",
    description: "Take a quiz with multiple choice questions and get your score.",
    path: "/mcq",
    icon: "📝",
  },
  {
    id: "practice",
    title: "Descriptive Practice",
    description: "Step through descriptive questions one by one for voice or written practice.",
    path: "/practice",
    icon: "🎤",
  },
];

function formatNum(n) {
  if (n == null || typeof n !== "number") return null;
  return n.toLocaleString();
}

export default function ChoosePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const limits = location.state || {};

  const extractedLength = limits.extractedLength;
  const maxTextForAi = limits.maxTextForAi;
  const truncatedForAi = limits.truncatedForAi;

  return (
    <div className="choose-page">
      <AppHeader />
      <h1 className="choose-title">What would you like to do?</h1>
      <p className="choose-subtitle">Choose one option to continue</p>

      {(extractedLength != null && extractedLength >= 0) && (
        <div className="choose-limits">
          <span className="choose-limits-label">Document:</span>{" "}
          {formatNum(extractedLength)} characters extracted.
          {truncatedForAi ? (
            <> First {formatNum(maxTextForAi)} will be used for AI (max allowed).</>
          ) : (
            <> Full document will be used for AI.</>
          )}
        </div>
      )}

      <div className="choose-grid">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className="choose-card"
            onClick={() => navigate(opt.path)}
          >
            <span className="choose-card-icon">{opt.icon}</span>
            <h2 className="choose-card-title">{opt.title}</h2>
            <p className="choose-card-desc">{opt.description}</p>
            <span className="choose-card-arrow">→</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="choose-back"
        onClick={() => navigate("/")}
      >
        ← Back to upload
      </button>
    </div>
  );
}
