const catchAsync = require("../utils/catchAsync");
const service = require("../Services/donorQueryAdminService");

exports.getStats = catchAsync(
  async (req, res) => {
    const days = Math.min(Math.max(parseInt(req.query.days) || 30, 1), 90);
    const data = await service.getDonorQueryStats(days);
    res.status(200).json({ status: "success", data });
  },
  { message: "Failed to get donor query stats" }
);
