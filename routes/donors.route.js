const express = require("express");

const router = express.Router();

const donorController = require("../Controllers/donors.Controller");

// NOTE: static paths are declared before the "/:email" parameter route so they
// can never be shadowed if the route list grows.

// get all donor info by area and group based
router
  .route("/public/donorInfo")
  .get(donorController.getBloodDonorByGroupAndArea);

// get all donors
router.route("/admin/users").get(donorController.getAllDonorInfo);

router
  .route("/")
  .post(donorController.createDonor)
  .patch(donorController.updateDonorProfile);

router
  .route("/:email")
  .get(donorController.donorInfo)
  .patch(donorController.changeRole);

module.exports = router;
