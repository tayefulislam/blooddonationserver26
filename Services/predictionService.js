const PredictionCache = require("../models/PredictionCache");
const BloodRequest = require("../models/bloodRequests");

const normalizeGroup = (raw) => {
  if (!raw) return "unknown";
  const up = raw.toUpperCase().trim();
  if (up.includes("AB")) return up.includes("-") ? "AB-" : "AB+";
  if (up.includes("A ") || up.startsWith("A")) return up.includes("-") ? "A-" : "A+";
  if (up.includes("B ") || up.startsWith("B")) return up.includes("-") ? "B-" : "B+";
  if (up.includes("O ") || up.startsWith("O")) return up.includes("-") ? "O-" : "O+";
  return raw;
};

const exponentialSmoothing = (data, alpha = 0.3) => {
  if (!data.length) return [];
  const result = [data[0]];
  for (let i = 1; i < data.length; i++) {
    result.push(alpha * data[i] + (1 - alpha) * result[i - 1]);
  }
  return result;
};

const linearTrend = (data) => {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0] || 0 };
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumX2 += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
};

const computeVariance = (data) => {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  return data.reduce((s, v) => s + (v - mean) ** 2, 0) / data.length;
};

const computeConfidence = (dataPoints, variance, avgValue) => {
  const dataScore = Math.min(dataPoints / 12, 1);
  const cv = avgValue > 0 ? Math.sqrt(variance) / avgValue : 1;
  const varianceScore = Math.max(1 - cv, 0.1);
  return Math.round(dataScore * varianceScore * 100);
};

const classifyDemand = (predicted, historicalMax) => {
  if (historicalMax === 0) return "LOW";
  const ratio = predicted / historicalMax;
  if (ratio < 0.25) return "LOW";
  if (ratio < 0.50) return "MEDIUM";
  if (ratio < 0.75) return "HIGH";
  return "CRITICAL";
};

const getCached = async (predictionType) => {
  const cached = await PredictionCache.findOne({
    predictionType,
    expiresAt: { $gt: new Date() },
  }).lean();
  return cached ? cached.data : null;
};

const setCache = async (predictionType, data) => {
  await PredictionCache.findOneAndUpdate(
    { predictionType, scope: "global" },
    {
      data,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 6 * 3600 * 1000),
    },
    { upsert: true }
  );
};

exports.getBloodDemandPredictions = async () => {
  const cached = await getCached("blood_demand");
  if (cached) return cached;

  const weeksBack = 16;
  const since = new Date(Date.now() - weeksBack * 7 * 24 * 60 * 60 * 1000);

  const weeklyData = await BloodRequest.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: {
          group: "$group",
          week: { $dateToString: { format: "%Y-W%V", date: "$createdAt" } },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.week": 1 } },
  ]);

  const groupWeekly = {};
  for (const item of weeklyData) {
    const group = normalizeGroup(item._id.group);
    if (!groupWeekly[group]) groupWeekly[group] = [];
    groupWeekly[group].push(item.count);
  }

  const allGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
  const predictions = [];

  for (const group of allGroups) {
    const series = groupWeekly[group] || [];
    if (series.length < 2) {
      predictions.push({
        group,
        predictedDemand: series[0] || 0,
        demandLevel: "LOW",
        confidence: 0,
        trend: "stable",
        dataPoints: series.length,
        history: series,
        insufficientData: series.length < 2,
      });
      continue;
    }

    const smoothed = exponentialSmoothing(series);
    const { slope } = linearTrend(smoothed);
    const lastSmoothed = smoothed[smoothed.length - 1];
    const predicted = Math.max(0, Math.round(lastSmoothed + slope * 4));
    const maxHistorical = Math.max(...series);
    const variance = computeVariance(series);

    let trend = "stable";
    if (slope > 0.5) trend = "up";
    else if (slope < -0.5) trend = "down";

    predictions.push({
      group,
      predictedDemand: predicted,
      demandLevel: classifyDemand(predicted, maxHistorical),
      confidence: computeConfidence(series.length, variance, lastSmoothed),
      trend,
      dataPoints: series.length,
      history: series,
      insufficientData: false,
    });
  }

  predictions.sort((a, b) => b.predictedDemand - a.predictedDemand);

  await setCache("blood_demand", predictions);
  return predictions;
};

exports.getAreaPredictions = async () => {
  const cached = await getCached("area_demand");
  if (cached) return cached;

  const weeksBack = 12;
  const since = new Date(Date.now() - weeksBack * 7 * 24 * 60 * 60 * 1000);

  const weeklyData = await BloodRequest.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: {
          district: "$district",
          week: { $dateToString: { format: "%Y-W%V", date: "$createdAt" } },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.week": 1 } },
  ]);

  const districtWeekly = {};
  for (const item of weeklyData) {
    const dist = item._id.district;
    if (!districtWeekly[dist]) districtWeekly[dist] = [];
    districtWeekly[dist].push(item.count);
  }

  const predictions = [];
  for (const [district, series] of Object.entries(districtWeekly)) {
    if (series.length < 2) {
      predictions.push({
        district,
        predictedDemand: series[0] || 0,
        demandLevel: "LOW",
        confidence: 0,
        trend: "stable",
        dataPoints: series.length,
        insufficientData: series.length < 2,
      });
      continue;
    }

    const smoothed = exponentialSmoothing(series);
    const { slope } = linearTrend(smoothed);
    const lastSmoothed = smoothed[smoothed.length - 1];
    const predicted = Math.max(0, Math.round(lastSmoothed + slope * 4));
    const maxHistorical = Math.max(...series);
    const variance = computeVariance(series);

    let trend = "stable";
    if (slope > 0.5) trend = "up";
    else if (slope < -0.5) trend = "down";

    predictions.push({
      district,
      predictedDemand: predicted,
      demandLevel: classifyDemand(predicted, maxHistorical),
      confidence: computeConfidence(series.length, variance, lastSmoothed),
      trend,
      dataPoints: series.length,
      insufficientData: false,
    });
  }

  predictions.sort((a, b) => b.predictedDemand - a.predictedDemand);

  await setCache("area_demand", predictions);
  return predictions;
};

exports.getSummaryPrediction = async () => {
  const cached = await getCached("summary");
  if (cached) return cached;

  const bloodPredictions = await exports.getBloodDemandPredictions();
  const areaPredictions = await exports.getAreaPredictions();

  const criticalGroups = bloodPredictions.filter((p) => p.demandLevel === "CRITICAL");
  const highGroups = bloodPredictions.filter((p) => p.demandLevel === "HIGH");
  const criticalAreas = areaPredictions.filter((p) => p.demandLevel === "CRITICAL");
  const highAreas = areaPredictions.filter((p) => p.demandLevel === "HIGH");

  const totalDataPoints = bloodPredictions.reduce((s, p) => s + p.dataPoints, 0);
  const hasEnoughData = totalDataPoints >= 4;

  const summary = {
    hasEnoughData,
    overallDemandLevel: "LOW",
    criticalGroups: criticalGroups.map((p) => p.group),
    highDemandGroups: highGroups.map((p) => p.group),
    criticalAreas: criticalAreas.map((p) => p.district),
    highDemandAreas: highAreas.map((p) => p.district),
    topRequestedGroup: bloodPredictions[0]?.group || "N/A",
    topDemandArea: areaPredictions[0]?.district || "N/A",
    generatedAt: new Date().toISOString(),
  };

  if (criticalGroups.length > 0) summary.overallDemandLevel = "CRITICAL";
  else if (highGroups.length > 0) summary.overallDemandLevel = "HIGH";
  else if (bloodPredictions.some((p) => p.demandLevel === "MEDIUM"))
    summary.overallDemandLevel = "MEDIUM";

  await setCache("summary", summary);
  return summary;
};

exports.refreshAll = async () => {
  const start = Date.now();
  await Promise.allSettled([
    exports.getBloodDemandPredictions(),
    exports.getAreaPredictions(),
    exports.getSummaryPrediction(),
  ]);
  console.log(`[PREDICTIONS] Refreshed in ${Date.now() - start}ms`);
};
