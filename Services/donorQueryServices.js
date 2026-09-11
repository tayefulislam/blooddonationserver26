const DonorQuery = require("../models/donorQuery");

/**
 * Total number of donor searches recorded, grouped into a single row.
 *
 * Returns an array (which may be empty) so the controller can keep sending
 * `result[0]` exactly as before.
 */
exports.getDonorQueryTotalHitCountService = async () =>
  DonorQuery.aggregate([
    {
      $group: {
        _id: "totalDonorQueryHit",
        total: { $sum: "$count" },
      },
    },
  ]);
