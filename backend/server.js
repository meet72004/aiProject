const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const authRoutes = require("./routes/auth");
const { authMiddleware } = require("./middleware/auth");
const SavedQuestion = require("./models/SavedQuestion");
const AppConfig = require("./models/AppConfig");
const PDFDocument = require("pdfkit");
require("dotenv").config();

const GEMINI_KEY_CONFIG = "gemini_api_key";
let geminiApiKeyOverride = null;

function getGeminiApiKey() {
  return geminiApiKeyOverride || process.env.GEMINI_API_KEY || null;
}

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ai-exam-assistant";
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    return AppConfig.findOne({ key: GEMINI_KEY_CONFIG }).then((doc) => {
      if (doc && doc.value) geminiApiKeyOverride = doc.value;
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Auth routes (no auth required)
app.use("/auth", authRoutes);

let storedText = "";
let generatedQuestions = null;

// Maximum characters of extracted text to send to the AI (Gemini 2.5 Flash supports ~1M tokens ≈ ~400k chars).
// Use env MAX_TEXT_FOR_AI to override (e.g. 500000 for very long documents).
const MAX_TEXT_FOR_AI = Math.min(
  parseInt(process.env.MAX_TEXT_FOR_AI, 10) || 300000,
  400000
);

// Warn early if no API key (env or DB) so it's easier to debug
setTimeout(() => {
  if (!getGeminiApiKey()) {
    console.error(
      "No Gemini API key set. Add GEMINI_API_KEY in backend/.env or set it in Profile → API key."
    );
  }
}, 2000);

// Ensure an uploads directory exists and always use an absolute path
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// Allow any file that looks like a PDF (by mimetype or extension)
// For flexibility, we accept any file type here; text extraction below
// will handle supported formats (PDF, DOCX, TXT, etc.) and gracefully
// degrade for unsupported ones.
const upload = multer({ storage });

app.get("/api/health", (req, res) => {
  res.send("AI Exam Assistant Server Running");
});

// API key settings (renew tokens when quota finishes)
app.get("/settings/gemini-key", authMiddleware, async (req, res) => {
  try {
    const key = getGeminiApiKey();
    res.json({ configured: !!key });
  } catch (err) {
    res.status(500).json({ error: "Failed to check API key status" });
  }
});

app.post("/settings/gemini-key", authMiddleware, async (req, res) => {
  try {
    const { apiKey } = req.body;
    const trimmed = typeof apiKey === "string" ? apiKey.trim() : "";
    if (!trimmed) {
      return res.status(400).json({ error: "API key is required" });
    }
    await AppConfig.findOneAndUpdate(
      { key: GEMINI_KEY_CONFIG },
      { key: GEMINI_KEY_CONFIG, value: trimmed },
      { upsert: true, new: true }
    );
    geminiApiKeyOverride = trimmed;
    res.json({ success: true, message: "API key updated. You can generate questions again." });
  } catch (err) {
    console.error("Save Gemini key error:", err);
    res.status(500).json({ error: "Failed to save API key" });
  }
});

// Expose limits so the frontend can show "extracted X, max for AI Y"
app.get("/limits", authMiddleware, (req, res) => {
  res.json({
    extractedLength: storedText.length,
    maxTextForAi: MAX_TEXT_FOR_AI,
    truncated: storedText.length > MAX_TEXT_FOR_AI,
  });
});

app.post("/upload", authMiddleware, (req, res) => {
  // Wrap multer so we can handle its errors and still respond with JSON
  upload.single("file")(req, res, async (err) => {
    if (err) {
      console.error("Upload error:", err);
      return res
        .status(400)
        .json({ error: err.message || "Upload failed, please try again." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname || "";
    const ext = path.extname(originalName).toLowerCase();

    try {
      let text = "";

      if (ext === ".pdf" || (req.file.mimetype && req.file.mimetype.toLowerCase().includes("pdf"))) {
        // PDF: use pdf-parse
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        text = data.text || "";
      } else if (ext === ".docx") {
        // DOCX: use mammoth
        const result = await mammoth.extractRawText({ path: filePath });
        text = result.value || "";
      } else if (ext === ".txt" || ext === ".md") {
        // Plain text / markdown
        text = fs.readFileSync(filePath, "utf8");
      } else {
        // File is uploaded but we don't know how to extract text
        console.warn("Unsupported file type for text extraction:", ext);
        return res.status(200).json({
          message:
            "File uploaded, but text could not be extracted. Supported formats for text extraction are PDF, DOCX, and TXT/MD.",
          textPreview: "",
        });
      }

      storedText = text;

      return res.json({
        message: "File uploaded and text extracted successfully",
        textPreview: storedText.substring(0, 1000),
        extractedLength: storedText.length,
        maxTextForAi: MAX_TEXT_FOR_AI,
        truncatedForAi: storedText.length > MAX_TEXT_FOR_AI,
      });
    } catch (error) {
      console.error("Text extraction error:", error);

      const msg = (error && error.message) ? String(error.message) : "";
      const isInvalidPdf = /invalid pdf|invalid pdf structure|pdf structure/i.test(msg);

      if (isInvalidPdf) {
        return res.status(400).json({
          error:
            "This PDF could not be read. It may be corrupted, password-protected, or use a format we don't support. Try re-saving the PDF (e.g. 'Print to PDF' or 'Save As PDF') or use a DOCX or TXT file instead.",
        });
      }

      return res.status(400).json({
        error:
          "File uploaded but text could not be extracted. The file may be image-only, corrupted, or in an unsupported format. Try a different file or format (e.g. DOCX, TXT).",
      });
    }
  });
});

app.get("/generate-questions", authMiddleware, (req, res) => {
  if (!storedText) {
    return res.status(400).json({
      message: "No PDF uploaded yet",
    });
  }

  res.json({
    message: "Text ready",
    textLength: storedText.length,
  });
});

// Build prompt with optional difficulty level (easy, medium, hard)
function buildQuestionsPrompt(studyText, level) {
  const levelLine = level
    ? `All questions must be ${level} difficulty. `
    : "";
  return `
From the study material below, generate ${levelLine}:

1. Five descriptive exam questions with answers.
2. Ten multiple choice questions.

Return result strictly in JSON format:

{
  "descriptive": [
    { "question": "", "answer": "" }
  ],
  "mcq": [
    {
      "question": "",
      "options": ["", "", "", ""],
      "correctAnswer": ""
    }
  ]
}

Study material:
${studyText}
`;
}

app.get("/ai-questions", authMiddleware, async (req, res) => {
  try {
    if (!storedText) {
      return res.status(400).json({
        message: "Upload study material first",
      });
    }

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return res.status(500).json({
        error: "AI API key is not configured. Add it in Profile → API key or set GEMINI_API_KEY in backend/.env.",
      });
    }

    const level = (req.query.level || "").toLowerCase();
    const validLevel = ["easy", "medium", "hard"].includes(level) ? level : null;

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({
      apiKey,
      apiVersion: "v1",
    });

    const prompt = buildQuestionsPrompt(
      storedText.substring(0, MAX_TEXT_FOR_AI),
      validLevel
    );

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text;

    // Some models wrap JSON in ```json fences or add minor text; try to
    // clean that up and parse defensively.
    let cleaned = text.replace(/```json|```/g, "").trim();

    // Try to isolate the JSON object if there's extra text around it
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Failed to parse AI JSON response:", parseErr);
      console.error("Raw AI response text:", text);
      return res.status(500).json({
        error:
          "AI responded with invalid JSON. Please try again or reduce the amount of text in the upload.",
      });
    }

    generatedQuestions = parsed;

    const sentLength = Math.min(storedText.length, MAX_TEXT_FOR_AI);
    res.json({
      ...parsed,
      _limits: {
        extractedLength: storedText.length,
        sentToAiLength: sentLength,
        maxTextForAi: MAX_TEXT_FOR_AI,
        truncated: storedText.length > MAX_TEXT_FOR_AI,
      },
    });
  } catch (error) {
    console.error("AI generation error:", error);

    // Try to surface a helpful message if the SDK provides one
    const message =
      error.response?.data?.error ||
      error.message ||
      "AI generation failed";

    res.status(500).json({
      error: message,
    });
  }
});

// Generate 10 more MCQs and append to existing list (optional ?level=easy|medium|hard)
app.get("/ai-more-mcq", authMiddleware, async (req, res) => {
  try {
    if (!storedText) {
      return res.status(400).json({ message: "Upload study material first" });
    }
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return res.status(500).json({ error: "AI API key is not configured. Add it in Profile → API key." });
    }

    const level = (req.query.level || "").toLowerCase();
    const validLevel = ["easy", "medium", "hard"].includes(level) ? level : null;
    const levelLine = validLevel ? ` at ${validLevel} difficulty` : "";

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({
      apiKey,
      apiVersion: "v1",
    });

    const prompt = `
From the study material below, generate exactly 10 new multiple choice questions${levelLine}.
Do not repeat questions from previous sets. Return only a JSON array of MCQs in this format:

[
  { "question": "", "options": ["", "", "", ""], "correctAnswer": "" },
  ...
]

Study material:
${storedText.substring(0, MAX_TEXT_FOR_AI)}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    let text = response.text.replace(/```json|```/g, "").trim();
    const firstBracket = text.indexOf("[");
    const lastBracket = text.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      text = text.slice(firstBracket, lastBracket + 1);
    }
    const newMcqs = JSON.parse(text);
    if (!Array.isArray(newMcqs)) throw new Error("Invalid response");

    if (!generatedQuestions) generatedQuestions = { descriptive: [], mcq: [] };
    if (!generatedQuestions.mcq) generatedQuestions.mcq = [];
    generatedQuestions.mcq = generatedQuestions.mcq.concat(newMcqs);

    res.json({ mcq: generatedQuestions.mcq });
  } catch (err) {
    console.error("AI more MCQ error:", err);
    res.status(500).json({ error: err.message || "Failed to generate more MCQs" });
  }
});

app.get("/questions", authMiddleware, (req, res) => {
  if (!generatedQuestions) {
    return res.status(400).json({
      message: "Generate questions first",
    });
  }

  res.json(generatedQuestions);
});

app.get("/mcq", authMiddleware, (req, res) => {
  if (!generatedQuestions || !generatedQuestions.mcq) {
    return res.status(400).json({
      message: "Generate questions first",
    });
  }

  res.json({ mcq: generatedQuestions.mcq });
});

app.post("/submit-mcq", authMiddleware, (req, res) => {
  if (!generatedQuestions || !generatedQuestions.mcq) {
    return res.status(400).json({
      message: "Generate MCQs first",
    });
  }

  const userAnswers = req.body.answers;
  const mcqs = generatedQuestions.mcq;

  let score = 0;
  let results = [];

  mcqs.forEach((q, index) => {
    const correct = q.correctAnswer;
    const userAns = userAnswers[index];

    if (userAns === correct) score++;

    results.push({
      question: q.question,
      correctAnswer: correct,
      userAnswer: userAns || null,
    });
  });

  res.json({
    totalQuestions: mcqs.length,
    score,
    results,
  });
});

app.get("/next-question/:index", authMiddleware, (req, res) => {
  if (!generatedQuestions || !generatedQuestions.descriptive) {
    return res.status(400).json({
      message: "Generate questions first",
    });
  }

  const index = parseInt(req.params.index);
  const questions = generatedQuestions.descriptive;

  if (index >= questions.length) {
    return res.json({ message: "No more questions" });
  }

  res.json({
    question: questions[index].question,
    answer: questions[index].answer,
  });
});

// ----- Saved questions (dashboard) -----
// Save a question with answer
app.post("/saved-questions", authMiddleware, async (req, res) => {
  try {
    const { question, answer } = req.body;
    if (!question || answer === undefined) {
      return res.status(400).json({ error: "question and answer are required" });
    }
    const saved = await SavedQuestion.create({
      user: req.user._id,
      question: String(question).trim(),
      answer: String(answer).trim(),
    });
    res.status(201).json(saved);
  } catch (err) {
    console.error("Save question error:", err);
    res.status(500).json({ error: "Failed to save question" });
  }
});

// List saved questions for current user
app.get("/saved-questions", authMiddleware, async (req, res) => {
  try {
    const list = await SavedQuestion.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ saved: list });
  } catch (err) {
    console.error("List saved error:", err);
    res.status(500).json({ error: "Failed to load saved questions" });
  }
});

// Delete one saved question
app.delete("/saved-questions/:id", authMiddleware, async (req, res) => {
  try {
    const doc = await SavedQuestion.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete saved error:", err);
    res.status(500).json({ error: "Failed to delete" });
  }
});

// Export saved questions as PDF
app.get("/saved-questions/export-pdf", authMiddleware, async (req, res) => {
  try {
    const list = await SavedQuestion.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="saved-questions-${Date.now()}.pdf"`
    );
    doc.pipe(res);
    doc.fontSize(18).text("Saved Questions & Answers", { align: "center" });
    doc.moveDown(1);
    if (list.length === 0) {
      doc.fontSize(12).text("No saved questions yet.");
      doc.end();
      return;
    }
    list.forEach((item, i) => {
      doc.fontSize(14).text(`Q${i + 1}: ${item.question}`, { continued: false });
      doc.fontSize(11).text(item.answer || "(No answer)");
      doc.moveDown(0.8);
    });
    doc.end();
  } catch (err) {
    console.error("Export PDF error:", err);
    if (!res.headersSent) res.status(500).json({ error: "Failed to export PDF" });
  }
});

const PORT = process.env.PORT || 5000;

// Serve React app from one port when frontend has been built
const frontendBuild = path.join(__dirname, "..", "frontend", "build");
if (fs.existsSync(frontendBuild)) {
  app.use(express.static(frontendBuild));
  app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(frontendBuild, "index.html"));
  });
  console.log("Serving frontend from same port.");
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
