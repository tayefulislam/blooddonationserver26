const mongoose = require("mongoose");

const AiUsageSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    feature: {
      type: String,
      enum: ["insights", "explanations", "test"],
      required: true,
    },
    promptTokens: {
      type: Number,
      default: 0,
    },
    completionTokens: {
      type: Number,
      default: 0,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    responseTimeMs: {
      type: Number,
    },
    success: {
      type: Boolean,
      default: true,
    },
    error: {
      type: String,
    },
  },
  { timestamps: true }
);

AiUsageSchema.index({ date: 1 });
AiUsageSchema.index({ date: 1, provider: 1 });

module.exports = mongoose.model("AiUsage", AiUsageSchema, "ai_usage");
