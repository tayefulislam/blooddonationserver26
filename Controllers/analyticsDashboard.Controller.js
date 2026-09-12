const catchAsync = require("../utils/catchAsync");
const analyticsEventService = require("../Services/analyticsEventService");
const bloodDemandService = require("../Services/bloodDemandService");
const locationAnalyticsService = require("../Services/locationAnalyticsService");
const timeAnalyticsService = require("../Services/timeAnalyticsService");
const deepSeekService = require("../Services/ai");

exports.getOverview = catchAsync(async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days) || 30, 1), 90);
  const [eventStats, bloodDemand, locations] = await Promise.all([
    analyticsEventService.getOverview(days),
    bloodDemandService.getBloodDemandAnalytics(days),
    locationAnalyticsService.getLocationAnalytics(days),
  ]);

  const insights = await deepSeekService.generateInsights({
    bloodDemand,
    locations,
    events: eventStats,
  });

  res.status(200).json({
    status: "success",
    data: { events: eventStats, bloodDemand, locations, insights, days },
  });
}, { message: "Failed to get analytics overview" });

exports.getBloodDemand = catchAsync(async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days) || 90, 1), 365);
  const data = await bloodDemandService.getBloodDemandAnalytics(days);
  res.status(200).json({ status: "success", data });
}, { message: "Failed to get blood demand analytics" });

exports.getLocationAnalytics = catchAsync(async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days) || 90, 1), 365);
  const data = await locationAnalyticsService.getLocationAnalytics(days);
  res.status(200).json({ status: "success", data });
}, { message: "Failed to get location analytics" });

exports.getTimeAnalytics = catchAsync(async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days) || 90, 1), 365);
  const data = await timeAnalyticsService.getTimeAnalytics(days);
  res.status(200).json({ status: "success", data });
}, { message: "Failed to get time analytics" });

exports.getUserActivity = catchAsync(async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.days) || 30, 1), 90);
  const data = await analyticsEventService.getUserActivity(days);
  res.status(200).json({ status: "success", data });
}, { message: "Failed to get user activity" });
