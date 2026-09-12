const catchAsync = require("../utils/catchAsync");
const analyticsService = require("../Services/analyticsService");

exports.getAnalytics = catchAsync(
  async (req, res) => {
    const days = Math.min(Math.max(parseInt(req.query.days) || 7, 1), 90);
    const data = await analyticsService.getAnalytics(days);
    res.status(200).json({ status: "success", data });
  },
  { message: "Failed to get analytics" }
);
