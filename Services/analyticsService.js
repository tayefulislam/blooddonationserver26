const ApiRequest = require("../models/ApiRequest");

exports.getAnalytics = async (days = 7) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const chartStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalAll, totalToday, totalChart, totalMonth] = await Promise.all([
    ApiRequest.countDocuments(),
    ApiRequest.countDocuments({ createdAt: { $gte: todayStart } }),
    ApiRequest.countDocuments({ createdAt: { $gte: chartStart } }),
    ApiRequest.countDocuments({ createdAt: { $gte: monthAgo } }),
  ]);

  const [avgResponseTime, statusBreakdown] = await Promise.all([
    ApiRequest.aggregate([
      { $group: { _id: null, avg: { $avg: "$durationMs" } } },
    ]),
    ApiRequest.aggregate([
      { $match: { createdAt: { $gte: monthAgo } } },
      {
        $group: {
          _id: "$statusCode",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const [requestsByDay, topRoutes, requestsByMethod, activeUsers] =
    await Promise.all([
      ApiRequest.aggregate([
        { $match: { createdAt: { $gte: chartStart } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
            avgDuration: { $avg: "$durationMs" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      ApiRequest.aggregate([
        { $match: { createdAt: { $gte: monthAgo } } },
        {
          $group: {
            _id: "$path",
            count: { $sum: 1 },
            avgDuration: { $avg: "$durationMs" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      ApiRequest.aggregate([
        { $match: { createdAt: { $gte: monthAgo } } },
        {
          $group: {
            _id: "$method",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      ApiRequest.aggregate([
        { $match: { userEmail: { $ne: "" }, createdAt: { $gte: monthAgo } } },
        {
          $group: {
            _id: "$userEmail",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

  return {
    overview: {
      totalAll,
      totalToday,
      totalChart,
      totalMonth,
      avgResponseTime: Math.round(avgResponseTime[0]?.avg || 0),
      days,
    },
    statusBreakdown: statusBreakdown.map((s) => ({
      status: s._id,
      count: s.count,
    })),
    requestsByDay: requestsByDay.map((d) => ({
      date: d._id,
      count: d.count,
      avgDuration: Math.round(d.avgDuration),
    })),
    topRoutes: topRoutes.map((r) => ({
      path: r._id,
      count: r.count,
      avgDuration: Math.round(r.avgDuration),
    })),
    requestsByMethod: requestsByMethod.map((m) => ({
      method: m._id,
      count: m.count,
    })),
    activeUsers: activeUsers.map((u) => ({
      email: u._id,
      count: u.count,
    })),
  };
};
