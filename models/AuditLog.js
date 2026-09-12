const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["update", "status_change", "delete"],
      required: true,
    },
    targetType: {
      type: String,
      enum: ["public_donor", "donor", "blood_request"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    targetName: {
      type: String,
      default: "",
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    adminEmail: {
      type: String,
      required: true,
    },
    adminRole: {
      type: String,
      enum: ["admin", "super_admin"],
      required: true,
    },
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ targetType: 1 });
AuditLogSchema.index({ adminEmail: 1 });

const AuditLog = mongoose.model("AuditLogs", AuditLogSchema, "audit_logs");
module.exports = AuditLog;
