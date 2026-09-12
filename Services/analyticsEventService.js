const AnalyticsEvent = require("../models/AnalyticsEvent");

const maskIp = (ip) => {
  if (!ip) return "";
  if (ip.includes(":")) {
    const parts = ip.split(":");
    parts[parts.length - 1] = "0";
    parts[parts.length - 2] = "0";
    return parts.join(":");
  }
  return ip.replace(/(\d+\.\d+)\.\d+\.\d+/, "$1.0.0");
};

exports.recordEvent = async ({
  eventType,
  userId = "",
  bloodGroup = "",
  district = "",
  area = "",
  metadata = {},
  ip = "",
  deviceInfo = "",
}) => {
  AnalyticsEvent.create({
    eventType,
    userId,
    bloodGroup,
    district,
    area,
    metadata,
    ip: maskIp(ip),
    deviceInfo,
  }).catch((err) =>
    console.error(`[ANALYTICS] Event recording failed: ${err.message}`)
  );
};

exports.getOverview = async (days = 30) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [totalEvents, eventsByType, uniqueUsers, eventsByDay, topDistricts] =
    await Promise.all([
      AnalyticsEvent.countDocuments({ createdAt: { $gte: since } }),
      AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: "$eventType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      AnalyticsEvent.distinct("userId", {
        createdAt: { $gte: since },
        userId: { $ne: "" },
      }),
      AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: since }, district: { $ne: "" } } },
        { $group: { _id: "$district", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

  return {
    totalEvents,
    uniqueUsers: uniqueUsers.length,
    eventsByType: eventsByType.map((e) => ({ type: e._id, count: e.count })),
    eventsByDay: eventsByDay.map((d) => ({ date: d._id, count: d.count })),
    topDistricts: topDistricts.map((d) => ({
      district: d._id,
      count: d.count,
    })),
    days,
  };
};

exports.getUserActivity = async (days = 30) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [activeUsersPerDay, topUsers, deviceBreakdown] = await Promise.all([
    AnalyticsEvent.aggregate([
      { $match: { createdAt: { $gte: since }, userId: { $ne: "" } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            user: "$userId",
          },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { createdAt: { $gte: since }, userId: { $ne: "" } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { createdAt: { $gte: since }, deviceInfo: { $ne: "" } } },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                {
                  case: { $regexMatch: { input: "$deviceInfo", regex: /mobile|android|iphone/i } },
                  then: "Mobile",
                },
                {
                  case: { $regexMatch: { input: "$deviceInfo", regex: /tablet|ipad/i } },
                  then: "Tablet",
                },
              ],
              default: "Desktop",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    activeUsersPerDay: activeUsersPerDay.map((d) => ({
      date: d._id,
      count: d.count,
    })),
    topUsers: topUsers.map((u) => ({ email: u._id, count: u.count })),
    deviceBreakdown: deviceBreakdown.map((d) => ({
      device: d._id,
      count: d.count,
    })),
  };
};
