const express = require("express");

const router = express.Router();

const donorQueryController = require("../Controllers/donorQuery.Controller");

router.route("/").get(donorQueryController.donorQueryTotalHitCountService);

module.exports = router;
