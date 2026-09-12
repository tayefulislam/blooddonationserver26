const catchAsync = require("../utils/catchAsync");
const service = require("../Services/auditLogService");

exports.list = catchAsync(
  async (req, res) => {
    const result = await service.getLogs(req.query, req.pagination);
    res.status(200).json({ status: "success", ...result });
  },
  { message: "Failed to list audit logs" }
);
