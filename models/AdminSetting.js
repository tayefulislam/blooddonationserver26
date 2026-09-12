const mongoose = require("mongoose");

const AdminSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

AdminSettingSchema.index({ key: 1 });

const AdminSetting = mongoose.model(
  "AdminSetting",
  AdminSettingSchema,
  "admin_settings"
);

module.exports = AdminSetting;
