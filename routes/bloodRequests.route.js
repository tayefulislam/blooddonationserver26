const express = require("express");
const router = express.Router();

const bloodRequestsController = require("../Controllers/bloodRequests.Controller");

router
  .route("/")
  .post(bloodRequestsController.makeBloodRequests)
  .get(bloodRequestsController.getBloodRequests);

router.route("/:id").get(bloodRequestsController.getBloodRequestById);

module.exports = router;
