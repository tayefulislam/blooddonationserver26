const catchAsync = require("../utils/catchAsync");
const service = require("../Services/adminPublicDonorService");
const auditLog = require("../Services/auditLogService");

exports.list = catchAsync(
  async (req, res) => {
    const result = await service.listPublicDonors(req.query, req.pagination);
    res.status(200).json({ status: "success", ...result });
  },
  { message: "Failed to list public donors" }
);

exports.getById = catchAsync(
  async (req, res) => {
    const donor = await service.getPublicDonorById(req.params.id);
    if (!donor) {
      return res
        .status(404)
        .json({ status: "failed", message: "Public donor not found" });
    }
    res.status(200).json({ status: "success", data: donor });
  },
  { message: "Failed to get public donor" }
);

exports.update = catchAsync(
  async (req, res) => {
    const old = await service.getPublicDonorById(req.params.id);
    const donor = await service.updatePublicDonor(
      req.params.id,
      req.body,
      req.user.email
    );
    if (!donor) {
      return res
        .status(404)
        .json({ status: "failed", message: "Public donor not found" });
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
      targetType: "public_donor",
      targetId: donor._id,
      targetName: donor.name,
      changes,
      adminEmail: req.user.email,
      adminRole: req.adminDonor.role,
    });

    res.status(200).json({ status: "success", data: donor });
  },
  { message: "Failed to update public donor" }
);

exports.remove = catchAsync(
  async (req, res) => {
    const donor = await service.getPublicDonorById(req.params.id);
    const deleted = await service.deletePublicDonor(req.params.id);
    if (!deleted) {
      return res
        .status(404)
        .json({ status: "failed", message: "Public donor not found" });
    }

    await auditLog.logAction({
      action: "delete",
      targetType: "public_donor",
      targetId: deleted._id,
      targetName: donor?.name || "",
      adminEmail: req.user.email,
      adminRole: req.adminDonor.role,
    });

    res
      .status(200)
      .json({ status: "success", message: "Public donor deleted" });
  },
  { message: "Failed to delete public donor" }
);
