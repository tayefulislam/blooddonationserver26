const catchAsync = require("../utils/catchAsync");
const service = require("../Services/adminDonorService");
const auditLog = require("../Services/auditLogService");

exports.list = catchAsync(
  async (req, res) => {
    const result = await service.listDonors(req.query, req.pagination);
    res.status(200).json({ status: "success", ...result });
  },
  { message: "Failed to list donors" }
);

exports.getById = catchAsync(
  async (req, res) => {
    const donor = await service.getDonorById(req.params.id);
    if (!donor) {
      return res
        .status(404)
        .json({ status: "failed", message: "Donor not found" });
    }
    res.status(200).json({ status: "success", data: donor });
  },
  { message: "Failed to get donor" }
);

exports.update = catchAsync(
  async (req, res) => {
    const old = await service.getDonorById(req.params.id);
    const donor = await service.updateDonor(
      req.params.id,
      req.body,
      req.user.email
    );
    if (!donor) {
      return res
        .status(404)
        .json({ status: "failed", message: "Donor not found" });
    }

    const changes = {};
    for (const key of Object.keys(req.body)) {
      if (old && String(old[key]) !== String(donor[key])) {
        changes[key] = { from: old[key], to: donor[key] };
      }
    }

    const action = (req.body.status && old && old.status !== req.body.status)
      ? "status_change"
      : "update";

    await auditLog.logAction({
      action,
      targetType: "donor",
      targetId: donor._id,
      targetName: donor.name,
      changes,
      adminEmail: req.user.email,
      adminRole: req.adminDonor.role,
    });

    res.status(200).json({ status: "success", data: donor });
  },
  { message: "Failed to update donor" }
);

exports.updateStatus = catchAsync(
  async (req, res) => {
    const { status } = req.body;
    if (!status || !["active", "inactive"].includes(status)) {
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid status value" });
    }

    const old = await service.getDonorById(req.params.id);
    const donor = await service.updateDonorStatus(
      req.params.id,
      status,
      req.user.email
    );
    if (!donor) {
      return res
        .status(404)
        .json({ status: "failed", message: "Donor not found" });
    }

    await auditLog.logAction({
      action: "status_change",
      targetType: "donor",
      targetId: donor._id,
      targetName: donor.name,
      changes: { status: { from: old?.status, to: status } },
      adminEmail: req.user.email,
      adminRole: req.adminDonor.role,
    });

    res.status(200).json({ status: "success", data: donor });
  },
  { message: "Failed to update donor status" }
);
