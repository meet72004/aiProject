const mongoose = require("mongoose");

const savedQuestionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { timestamps: true }
);

savedQuestionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("SavedQuestion", savedQuestionSchema);
