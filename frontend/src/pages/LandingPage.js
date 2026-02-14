import { Link } from "react-router-dom";
import "./LandingPage.css";

const STEPS = [
  { step: 1, title: "Upload", desc: "Drop your PDF, Word, TXT or Markdown. We extract the text so AI can use your full material." },
  { step: 2, title: "Generate", desc: "AI creates descriptive and multiple-choice questions. Pick difficulty: easy, medium or hard." },
  { step: 3, title: "Practice", desc: "Take MCQ quizzes or step through descriptive Q&A one by one. Get more MCQs anytime." },
  { step: 4, title: "Save & download", desc: "Save any question and answer to your dashboard. Download all saved Q&A as one PDF." },
];

const FEATURES = [
  {
    icon: "📄",
    title: "Upload any material",
    text: "PDF, DOCX, TXT and Markdown supported. Full text extraction so AI can work with your entire document.",
  },
  {
    icon: "✨",
    title: "AI question generation",
    text: "Descriptive and MCQ questions in seconds. Choose difficulty (easy / medium / hard) and generate new sets anytime.",
  },
  {
    icon: "📝",
    title: "MCQ quiz",
    text: "Take a quiz, submit answers, see your score instantly. Need more? Get additional MCQs with optional difficulty filter.",
  },
  {
    icon: "🎤",
    title: "Descriptive practice",
    text: "Step through questions one by one—perfect for voice or written practice. Reveal answers when you're ready.",
  },
  {
    icon: "💾",
    title: "Save to dashboard",
    text: "Save any question and answer from Generate or Practice. Your dashboard keeps all saved Q&A in one place.",
  },
  {
    icon: "📥",
    title: "Download as PDF",
    text: "Export all your saved questions and answers as a single PDF. Study offline or print for revision.",
  },
  {
    icon: "🔑",
    title: "Renew API key",
    text: "When your Gemini quota runs out, paste a new API key from Profile → API key. No server restart needed.",
  },
];

export default function LandingPage() {
  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-hero-bg">
          <div className="landing-hero-glow landing-hero-glow--1" />
          <div className="landing-hero-glow landing-hero-glow--2" />
          <div className="landing-hero-grid" aria-hidden="true" />
        </div>
        <div className="landing-hero-content">
          <p className="landing-hero-badge">AI-powered exam prep</p>
          <h1 className="landing-hero-title">
            Turn your notes into practice questions
          </h1>
          <p className="landing-hero-tagline">
            Upload study material, get AI-generated descriptive and MCQ questions,
            practice with quizzes, and save or download everything for later.
          </p>
          <a href="#auth" className="landing-hero-cta">
            Get started
            <span className="landing-hero-cta-arrow">→</span>
          </a>
        </div>
        <div className="landing-hero-scroll" aria-hidden="true">
          <span className="landing-hero-scroll-line" />
          <span className="landing-hero-scroll-text">Scroll</span>
        </div>
      </section>

      <section className="landing-how" id="how">
        <h2 className="landing-heading">How it works</h2>
        <p className="landing-subheading">
          Four simple steps from upload to revision
        </p>
        <div className="landing-steps">
          {STEPS.map((item, i) => (
            <div key={item.step} className="landing-step">
              <div className="landing-step-num">{item.step}</div>
              <h3 className="landing-step-title">{item.title}</h3>
              <p className="landing-step-desc">{item.desc}</p>
              {i < STEPS.length - 1 && <div className="landing-step-connector" />}
            </div>
          ))}
        </div>
      </section>

      <section className="landing-features" id="features">
        <h2 className="landing-heading">Everything you get</h2>
        <p className="landing-subheading">
          Upload, generate, practice, save and download—all in one place
        </p>
        <div className="landing-features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="landing-feature-card" style={{ animationDelay: `${i * 0.06}s` }}>
              <span className="landing-feature-icon">{f.icon}</span>
              <h3 className="landing-feature-title">{f.title}</h3>
              <p className="landing-feature-text">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="auth" className="landing-auth">
        <div className="landing-auth-inner">
          <h2 className="landing-auth-title">Start studying smarter</h2>
          <p className="landing-auth-desc">
            Log in or create an account to upload materials, generate questions,
            and save or download your Q&A.
          </p>
          <div className="landing-auth-actions">
            <Link to="/login" className="landing-auth-btn landing-auth-btn--primary">
              Log in
            </Link>
            <Link to="/register" className="landing-auth-btn landing-auth-btn--secondary">
              Sign up
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p className="landing-footer-text">AI Exam Preparation Assistant — Study smarter.</p>
      </footer>
    </div>
  );
}
