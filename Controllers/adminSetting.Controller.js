const catchAsync = require("../utils/catchAsync");
const adminSettingService = require("../Services/adminSettingService");

exports.getSettings = catchAsync(async (req, res) => {
  const settings = await adminSettingService.getAllSettings();
  res.status(200).json({ status: "success", data: settings });
}, { message: "Failed to get settings" });

exports.updateSetting = catchAsync(async (req, res) => {
  const { key, value, description } = req.body;
  if (!key || typeof value === "undefined") {
    return res.status(400).json({ status: "failed", message: "key and value are required" });
  }
  const setting = await adminSettingService.setSetting(key, value, description);
  res.status(200).json({ status: "success", data: setting });
}, { message: "Failed to update setting" });
