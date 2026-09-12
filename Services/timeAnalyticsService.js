const BloodRequest = require("../models/bloodRequests");

const DAY_NAMES = ["", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

exports.getTimeAnalytics = async (days = 90) => {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [byHour, byDayOfWeek, byMonth, byWeek] = await Promise.all([
    BloodRequest.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $hour: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    BloodRequest.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dayOfWeek: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
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
      { $match: { createdAt: { $gte: new Date(Date.now() - 24 * 7 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-W%V", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const hourData = Array.from({ length: 24 }, (_, i) => {
    const found = byHour.find((d) => d._id === i);
    return { hour: i, count: found ? found.count : 0 };
  });

  const maxHourCount = Math.max(...hourData.map((d) => d.count), 1);
  const peakHours = hourData
    .filter((d) => d.count > maxHourCount * 0.5)
    .map((d) => d.hour);

  const dayData = Array.from({ length: 7 }, (_, i) => {
    const found = byDayOfWeek.find((d) => d._id === i + 1);
    return { day: i + 1, dayName: DAY_NAMES[i + 1], count: found ? found.count : 0 };
  });

  const maxDayCount = Math.max(...dayData.map((d) => d.count), 1);
  const peakDays = dayData
    .filter((d) => d.count > maxDayCount * 0.7)
    .map((d) => d.dayName);

  return {
    byHour: hourData,
    peakHours,
    byDayOfWeek: dayData,
    peakDays,
    byMonth: byMonth.map((d) => ({ month: d._id, count: d.count })),
    byWeek: byWeek.map((d) => ({ week: d._id, count: d.count })),
  };
};
