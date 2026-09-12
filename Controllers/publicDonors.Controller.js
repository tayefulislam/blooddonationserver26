const catchAsync = require("../utils/catchAsync");
const { pickQueryStrings } = require("../utils/requestHelpers");
const {
  createPublicDonorsServices,
  getAllPublicDonorsServices,
  updateAreaOrLastDonationDateServices,
} = require("../Services/publicDonorsServices");

exports.createPublicDonors = catchAsync(
  async (req, res) => {
    req.body.createdBy = "self";
    const result = await createPublicDonorsServices(req.body);
    res.status(200).json(result);
  },
  { message: "Create Donor Request Failed" },
);

exports.getAllPublicDonors = catchAsync(
  async (req, res) => {
    // Filters are forced server-side and cannot be overridden by the client.
    const queries = pickQueryStrings(req.query, ["group", "district"]);
    queries.status = "active";
    queries.gender = "male";

    const results = await getAllPublicDonorsServices(queries);
    res.status(200).send(results);
  },
  { message: "Create Donor Request Failed" },
);

exports.updateAreaOrLastDonationDate = catchAsync(
  async (req, res) => {
    const updateInfo = await updateAreaOrLastDonationDateServices(req.body);
    res.status(200).send(updateInfo);
  },
  { message: "Failed to update District / Last Donation Date" },
);
