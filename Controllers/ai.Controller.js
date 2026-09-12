const catchAsync = require("../utils/catchAsync");
const { PROVIDERS, PROVIDER_MODELS, PROVIDER_LABELS } = require("../Services/ai/providers");
const AiUsage = require("../models/AiUsage");
const adminSettingService = require("../Services/adminSettingService");

exports.testConnection = catchAsync(async (req, res) => {
  const { provider: providerName, model } = req.body;
  const name = providerName || (await adminSettingService.getSetting("ai_provider")) || "deepseek";
  const provider = PROVIDERS[name];

  if (!provider) {
    return res.status(400).json({
      status: "failed",
      message: `Unknown provider: ${name}`,
    });
  }

  if (!provider.isConfigured()) {
    return res.status(200).json({
      status: "success",
      data: {
        success: false,
        provider: name,
        providerLabel: PROVIDER_LABELS[name] || name,
        model: model || provider.defaultModel,
        error: `${PROVIDER_LABELS[name] || name} is not configured. Please add the API key.`,
      },
    });
  }

  const result = await provider.testConnection(model);

  res.status(200).json({
    status: "success",
    data: {
      ...result,
      provider: name,
      providerLabel: PROVIDER_LABELS[name] || name,
    },
  });
}, { message: "Failed to test AI connection" });

exports.getUsageStats = catchAsync(async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [todayStats, weekStats, byProvider] = await Promise.all([
    AiUsage.aggregate([
      { $match: { date: today } },
      {
        $group: {
          _id: null,
          requests: { $sum: 1 },
          successful: { $sum: { $cond: ["$success", 1, 0] } },
          failed: { $sum: { $cond: ["$success", 0, 1] } },
          totalTokens: { $sum: "$totalTokens" },
          avgResponseTime: { $avg: "$responseTimeMs" },
        },
      },
    ]),
    AiUsage.aggregate([
      { $match: { date: { $gte: sevenDaysAgo, $lte: today } } },
      {
        $group: {
          _id: null,
          requests: { $sum: 1 },
          successful: { $sum: { $cond: ["$success", 1, 0] } },
          failed: { $sum: { $cond: ["$success", 0, 1] } },
          totalTokens: { $sum: "$totalTokens" },
        },
      },
    ]),
    AiUsage.aggregate([
      { $match: { date: { $gte: sevenDaysAgo, $lte: today } } },
      {
        $group: {
          _id: "$provider",
          requests: { $sum: 1 },
          successful: { $sum: { $cond: ["$success", 1, 0] } },
          failed: { $sum: { $cond: ["$success", 0, 1] } },
          totalTokens: { $sum: "$totalTokens" },
        },
      },
      { $sort: { requests: -1 } },
    ]),
  ]);

  res.status(200).json({
    status: "success",
    data: {
      today: todayStats[0] || { requests: 0, successful: 0, failed: 0, totalTokens: 0, avgResponseTime: 0 },
      week: weekStats[0] || { requests: 0, successful: 0, failed: 0, totalTokens: 0 },
      byProvider: byProvider.map((p) => ({
        provider: p._id,
        providerLabel: PROVIDER_LABELS[p._id] || p._id,
        requests: p.requests,
        successful: p.successful,
        failed: p.failed,
        totalTokens: p.totalTokens,
      })),
    },
  });
}, { message: "Failed to get AI usage stats" });

exports.getProviderStatus = catchAsync(async (req, res) => {
  const statuses = Object.entries(PROVIDERS).map(([name, provider]) => ({
    name,
    label: PROVIDER_LABELS[name] || name,
    configured: provider.isConfigured(),
    models: PROVIDER_MODELS[name] || [],
  }));

  res.status(200).json({
    status: "success",
    data: statuses,
  });
}, { message: "Failed to get provider status" });
