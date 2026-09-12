const express = require("express");

const router = express.Router();

const publicDonorController = require("../Controllers/publicDonors.Controller");
const trackEvent = require("../middleware/trackAnalyticsEvent");

router
  .route("/")
  .get(
    trackEvent("search", (req) => ({
      bloodGroup: req.query.group || "",
      district: req.query.district || "",
    })),
    publicDonorController.getAllPublicDonors
  )
  .post(
    trackEvent("public_donor_registration", (req) => ({
      bloodGroup: req.body.group || "",
      district: req.body.district || "",
      area: req.body.area || "",
    })),
    publicDonorController.createPublicDonors
  );

router
  .route("/updateAreaOrLastDonationDate")
  .patch(publicDonorController.updateAreaOrLastDonationDate);

module.exports = router;
