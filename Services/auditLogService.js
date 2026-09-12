const AuditLog = require("../models/AuditLog");

exports.logAction = async ({ action, targetType, targetId, targetName, changes, adminEmail, adminRole }) => {
  try {
    await AuditLog.create({
      action,
      targetType,
      targetId,
      targetName: targetName || "",
      changes: changes || {},
      adminEmail,
      adminRole,
    });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
};

exports.getLogs = async (query, pagination) => {
  const { search, targetType, action } = query;
  const { page, limit } = pagination;

  const filter = {};
  if (targetType) filter.targetType = targetType;
  if (action) filter.action = action;

  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [
      { adminEmail: { $regex: regex } },
      { targetName: { $regex: regex } },
    ];
  }

  const total = await AuditLog.countDocuments(filter);
  const logs = await AuditLog.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    data: logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
