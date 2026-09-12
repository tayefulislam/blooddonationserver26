const Donor = require("../models/Donor");

const adminOnly = async (req, res, next) => {
  try {
    if (!req.user?.email) {
      return res
        .status(401)
        .json({ status: "failed", message: "Unauthorized" });
    }

    const donor = await Donor.findOne({ email: req.user.email }).lean();
    if (!donor || !["admin", "super_admin"].includes(donor.role)) {
      return res
        .status(403)
        .json({ status: "failed", message: "Forbidden: Admin access required" });
    }

    req.adminDonor = donor;
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ status: "failed", message: "Authorization check failed" });
  }
};

module.exports = adminOnly;
