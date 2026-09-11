const catchAsync = require("../utils/catchAsync");
const {
  getDonorQueryTotalHitCountService,
} = require("../Services/donorQueryServices");

exports.donorQueryTotalHitCountService = catchAsync(
  async (req, res) => {
    const getTotalHitLive = await getDonorQueryTotalHitCountService();
    // Kept as `[0]` so an empty collection still yields an empty 200 body.
    res.status(200).send(getTotalHitLive[0]);
  },
  { message: "Failed to get total hit count." },
);
