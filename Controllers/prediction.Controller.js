const catchAsync = require("../utils/catchAsync");
const predictionService = require("../Services/predictionService");
const deepSeekService = require("../Services/ai");

exports.getBloodDemandPredictions = catchAsync(async (req, res) => {
  const predictions = await predictionService.getBloodDemandPredictions();
  const explanation = await deepSeekService.explainPrediction(predictions);
  res.status(200).json({
    status: "success",
    data: predictions,
    explanation,
  });
}, { message: "Failed to get blood demand predictions" });

exports.getAreaPredictions = catchAsync(async (req, res) => {
  const predictions = await predictionService.getAreaPredictions();
  res.status(200).json({ status: "success", data: predictions });
}, { message: "Failed to get area predictions" });

exports.getSummary = catchAsync(async (req, res) => {
  const summary = await predictionService.getSummaryPrediction();
  const explanation = await deepSeekService.generateInsights(summary);
  res.status(200).json({
    status: "success",
    data: summary,
    aiInsights: explanation,
  });
}, { message: "Failed to get prediction summary" });
