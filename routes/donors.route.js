const express = require("express");

const router = express.Router();

const donorController = require("../Controllers/donors.Controller");
const trackEvent = require("../middleware/trackAnalyticsEvent");

// NOTE: static paths are declared before the "/:email" parameter route so they
// can never be shadowed if the route list grows.

// get all donor info by area and group based
router
  .route("/public/donorInfo")
  .get(
    trackEvent("search", (req) => ({
      bloodGroup: req.query.group || "",
      district: req.query.district || "",
    })),
    donorController.getBloodDonorByGroupAndArea
  );

// get all donors
router.route("/admin/users").get(donorController.getAllDonorInfo);

router
  .route("/")
  .post(
    trackEvent("donor_registration", (req) => ({
      bloodGroup: req.body.group || "",
      district: req.body.district || "",
      area: req.body.area || "",
    })),
    donorController.createDonor
  )
  .patch(donorController.updateDonorProfile);

router
  .route("/:email")
  .get(donorController.donorInfo)
  .patch(donorController.changeRole);

module.exports = router;
