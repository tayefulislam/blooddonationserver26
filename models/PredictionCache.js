const mongoose = require("mongoose");

const PredictionCacheSchema = new mongoose.Schema(
  {
    predictionType: {
      type: String,
      enum: ["blood_demand", "area_demand", "time_demand", "summary"],
      required: true,
    },
    scope: {
      type: String,
      default: "global",
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

PredictionCacheSchema.index({ predictionType: 1, scope: 1 }, { unique: true });
PredictionCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PredictionCache = mongoose.model(
  "PredictionCache",
  PredictionCacheSchema,
  "prediction_caches"
);

module.exports = PredictionCache;
