const catchAsync = require("../utils/catchAsync");
const { getDashboardStats } = require("../Services/adminDashboardService");

exports.getDashboardStats = catchAsync(
  async (req, res) => {
    const stats = await getDashboardStats();
    res.status(200).json({ status: "success", data: stats });
  },
  { message: "Failed to get dashboard stats" }
);
