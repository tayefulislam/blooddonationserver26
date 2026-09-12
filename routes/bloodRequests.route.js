const express = require("express");
const router = express.Router();

const bloodRequestsController = require("../Controllers/bloodRequests.Controller");
const trackEvent = require("../middleware/trackAnalyticsEvent");

router
  .route("/")
  .post(
    trackEvent("blood_request", (req) => ({
      bloodGroup: req.body.group || "",
      district: req.body.district || "",
      area: req.body.area || "",
    })),
    bloodRequestsController.makeBloodRequests
  )
  .get(
    trackEvent("page_view"),
    bloodRequestsController.getBloodRequests
  );

router.route("/:id").get(bloodRequestsController.getBloodRequestById);

module.exports = router;
