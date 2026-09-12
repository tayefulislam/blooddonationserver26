const Donor = require("../models/Donor");
const PublicDonor = require("../models/publicDonors");
const BloodRequest = require("../models/bloodRequests");

exports.getLocationAnalytics = async (days = 90) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [
    donorsByDistrict,
    publicDonorsByDistrict,
    requestsByDistrict,
    topAreas,
    fulfillByDistrict,
    donorGroupByDistrict,
  ] = await Promise.all([
    Donor.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: "$district", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    PublicDonor.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: "$district", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    BloodRequest.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$district", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Donor.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: { district: "$district", area: "$area" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
    BloodRequest.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { district: "$district", status: "$status" },
          count: { $sum: 1 },
        },
      },
    ]),
    BloodRequest.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { district: "$district", group: "$group" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 30 },
    ]),
  ]);

  const mergedDistricts = {};
  for (const d of donorsByDistrict) {
    mergedDistricts[d._id] = (mergedDistricts[d._id] || 0) + d.count;
  }
  for (const d of publicDonorsByDistrict) {
    mergedDistricts[d._id] = (mergedDistricts[d._id] || 0) + d.count;
  }
  const donorsByDistrictMerged = Object.entries(mergedDistricts)
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => b.count - a.count);

  const fulfillByDistrictMap = {};
  for (const item of fulfillByDistrict) {
    const dist = item._id.district;
    if (!fulfillByDistrictMap[dist]) {
      fulfillByDistrictMap[dist] = { open: 0, fulfilled: 0, cancelled: 0, closed: 0 };
    }
    fulfillByDistrictMap[dist][item._id.status] = item.count;
  }

  return {
    donorsByDistrict: donorsByDistrictMerged,
    requestsByDistrict: requestsByDistrict.map((d) => ({
      district: d._id,
      count: d.count,
    })),
    topAreas: topAreas.map((d) => ({
      district: d._id.district,
      area: d._id.area,
      count: d.count,
    })),
    fulfillByDistrict: Object.entries(fulfillByDistrictMap).map(([district, v]) => ({
      district,
      ...v,
      total: v.open + v.fulfilled + v.cancelled + v.closed,
    })),
    demandByDistrictAndGroup: donorGroupByDistrict.map((d) => ({
      district: d._id.district,
      group: d._id.group,
      count: d.count,
    })),
  };
};
