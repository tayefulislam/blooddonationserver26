const DonorQuery = require("../models/donorQuery");

exports.getDonorQueryStats = async (days = 30) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [totalQueries, topCombinations, queriesByGroup, queriesByDistrict, recentQueries, totalCombinations] =
    await Promise.all([
      DonorQuery.aggregate([{ $group: { _id: null, total: { $sum: "$count" } } }]),
      DonorQuery.find()
        .sort({ count: -1 })
        .limit(20)
        .lean(),
      DonorQuery.aggregate([
        { $group: { _id: "$group", total: { $sum: "$count" } } },
        { $sort: { total: -1 } },
      ]),
      DonorQuery.aggregate([
        { $group: { _id: "$district", total: { $sum: "$count" } } },
        { $sort: { total: -1 } },
        { $limit: 15 },
      ]),
      DonorQuery.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      DonorQuery.distinct("donorQueryByDistrictAndGroup").then((d) => d.length),
    ]);

  return {
    overview: {
      totalQueries: totalQueries[0]?.total || 0,
      uniqueCombinations: totalCombinations,
    },
    topCombinations: topCombinations.map((q) => ({
      label: q.donorQueryByDistrictAndGroup,
      group: q.group,
      district: q.district,
      count: q.count,
    })),
    byGroup: queriesByGroup.map((q) => ({ group: q._id, count: q.total })),
    byDistrict: queriesByDistrict.map((q) => ({ district: q._id, count: q.total })),
    recent: recentQueries.map((q) => ({
      label: q.donorQueryByDistrictAndGroup,
      group: q.group,
      district: q.district,
      count: q.count,
      createdAt: q.createdAt,
    })),
  };
};
