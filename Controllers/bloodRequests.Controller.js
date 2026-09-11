const catchAsync = require("../utils/catchAsync");
const { pickQueryStrings } = require("../utils/requestHelpers");
const {
  makeBloodRequestsService,
  getBloodRequestsService,
  getBloodRequestByIdService,
} = require("../Services/bloodRequests.Services");

exports.makeBloodRequests = catchAsync(
  async (req, res) => {
    const result = await makeBloodRequestsService(req.body);
    res.status(200).send(result);
  },
  { message: "Blood Request Failed" },
);

exports.getBloodRequests = catchAsync(
  async (req, res) => {
    // Only `group` and `district` are honoured, and only as plain strings.
    const queries = pickQueryStrings(req.query, ["group", "district"]);

    const result = await getBloodRequestsService(queries);
    res.status(200).json(result);
  },
  { message: "No Blood Request found" },
);

exports.getBloodRequestById = catchAsync(
  async (req, res) => {
    const result = await getBloodRequestByIdService(req.params.id);
    res.status(200).send(result);
  },
  { message: "No Match Blood Request found" },
);
