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

const normalizeGroups = (data) =>
  data.map((d) => ({ ...d, group: normalizeGroup(d._id), _id: undefined }));

exports.getBloodDemandAnalytics = async (days = 90) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const trendSince = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000);

  const [
    demandByGroup,
    demandByMonth,
    demandByWeekday,
    demandByHour,
    statusBreakdown,
    demandByDistrict,
    weeklyTrend,
    demandByDistrictAndGroup,
  ] = await Promise.all([
    BloodRequest.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$group", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
    BloodRequest.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    BloodRequest.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dayOfWeek: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    BloodRequest.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $hour: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    BloodRequest.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    BloodRequest.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$district", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 15 },
    ]),
    BloodRequest.aggregate([
      { $match: { createdAt: { $gte: trendSince } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-W%V", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
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
      { $limit: 20 },
    ]),
  ]);

  const totalRequests = statusBreakdown.reduce((s, d) => s + d.count, 0);
  const fulfilled =
    statusBreakdown.find((d) => d._id === "fulfilled")?.count || 0;
  const open = statusBreakdown.find((d) => d._id === "open")?.count || 0;
  const cancelled =
    statusBreakdown.find((d) => d._id === "cancelled")?.count || 0;
  const closed =
    statusBreakdown.find((d) => d._id === "closed")?.count || 0;

  return {
    demandByGroup: normalizeGroups(demandByGroup),
    demandByMonth: demandByMonth.map((d) => ({ month: d._id, count: d.count })),
    demandByWeekday: demandByWeekday.map((d) => ({
      day: d._id,
      count: d.count,
    })),
    demandByHour: demandByHour.map((d) => ({
      hour: d._id,
      count: d.count,
    })),
    fulfillmentRate: {
      total: totalRequests,
      fulfilled,
      open,
      cancelled,
      closed,
      rate: totalRequests > 0
        ? Math.round((fulfilled / totalRequests) * 100)
        : 0,
    },
    demandByDistrict: demandByDistrict.map((d) => ({
      district: d._id,
      count: d.total,
    })),
    weeklyTrend: weeklyTrend.map((d) => ({
      week: d._id,
      count: d.count,
    })),
    demandByDistrictAndGroup: demandByDistrictAndGroup.map((d) => ({
      district: d._id.district,
      group: normalizeGroup(d._id.group),
      count: d.count,
    })),
    days,
  };
};
