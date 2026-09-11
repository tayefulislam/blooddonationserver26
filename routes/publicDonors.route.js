const express = require("express");

const router = express.Router();

const publicDonorController = require("../Controllers/publicDonors.Controller");

router
  .route("/")
  .get(publicDonorController.getAllPublicDonors)
  .post(publicDonorController.createPublicDonors);

router
  .route("/updateAreaOrLastDonationDate")
  .patch(publicDonorController.updateAreaOrLastDonationDate);

module.exports = router;
