const catchAsync = require("../utils/catchAsync");
const service = require("../Services/adminBloodRequestService");
const auditLog = require("../Services/auditLogService");

exports.list = catchAsync(
  async (req, res) => {
    const result = await service.listBloodRequests(req.query, req.pagination);
    res.status(200).json({ status: "success", ...result });
  },
  { message: "Failed to list blood requests" }
);

exports.getById = catchAsync(
  async (req, res) => {
    const request = await service.getBloodRequestById(req.params.id);
    if (!request) {
      return res
        .status(404)
        .json({ status: "failed", message: "Blood request not found" });
    }
    res.status(200).json({ status: "success", data: request });
  },
  { message: "Failed to get blood request" }
);

exports.update = catchAsync(
  async (req, res) => {
    const old = await service.getBloodRequestById(req.params.id);
    const request = await service.updateBloodRequest(
      req.params.id,
      req.body,
      req.user.email
    );
    if (!request) {
      return res
        .status(404)
        .json({ status: "failed", message: "Blood request not found" });
    }

    const changes = {};
    for (const key of Object.keys(req.body)) {
      if (old && String(old[key]) !== String(request[key])) {
        changes[key] = { from: old[key], to: request[key] };
      }
    }

    const action = (req.body.status && old && old.status !== req.body.status)
      ? "status_change"
      : "update";

    await auditLog.logAction({
      action,
      targetType: "blood_request",
      targetId: request._id,
      targetName: request.patient,
      changes,
      adminEmail: req.user.email,
      adminRole: req.adminDonor.role,
    });

    res.status(200).json({ status: "success", data: request });
  },
  { message: "Failed to update blood request" }
);

exports.remove = catchAsync(
  async (req, res) => {
    const request = await service.getBloodRequestById(req.params.id);
    const deleted = await service.deleteBloodRequest(req.params.id);
    if (!deleted) {
      return res
        .status(404)
        .json({ status: "failed", message: "Blood request not found" });
    }

    await auditLog.logAction({
      action: "delete",
      targetType: "blood_request",
      targetId: deleted._id,
      targetName: request?.patient || "",
      adminEmail: req.user.email,
      adminRole: req.adminDonor.role,
    });

    res
      .status(200)
      .json({ status: "success", message: "Blood request deleted" });
  },
  { message: "Failed to delete blood request" }
);
