const catchAsync = require("../utils/catchAsync");
const { pickQueryStrings, toQueryString } = require("../utils/requestHelpers");
const {
  createDonorService,
  updateDonorProfileService,
  donorInfoService,
  getAllDonorInfoService,
  changeRoleService,
  getBloodDonorByGroupAndAreaService,
} = require("../Services/donors.Services");

exports.createDonor = catchAsync(
  async (req, res) => {
    req.body.createdBy = "self";
    const result = await createDonorService(req.body);
    res.status(200).json(result);
  },
  { message: "Create Donor Request Failed" },
);

exports.updateDonorProfile = catchAsync(
  async (req, res) => {
    const donor = req.body;
    const filter = { email: donor?.email };

    const result = await updateDonorProfileService(filter, donor);
    res.status(200).send(result);
  },
  { message: "Create Donor Request Failed" },
);

exports.donorInfo = catchAsync(
  async (req, res) => {
    const result = await donorInfoService(req.params.email);
    res.status(200).send(result);
  },
  { message: "Create Donor Request Failed" },
);

/// Admin Action

exports.getAllDonorInfo = catchAsync(
  async (req, res) => {
    const email = toQueryString(req.query.email);

    const queries = {};
    const search = toQueryString(req.query.search);
    if (search) {
      queries.search = search;
    }

    const result = await getAllDonorInfoService(email, queries);
    res.status(200).send(result);
  },
  { message: "User Data Not Found" },
);

exports.changeRole = catchAsync(
  async (req, res) => {
    const result = await changeRoleService(req.params.email);
    res.status(200).send(result);
  },
  { message: "Create Donor Request Failed" },
);

exports.getBloodDonorByGroupAndArea = catchAsync(
  async (req, res) => {
    const queries = pickQueryStrings(req.query, ["group", "district"]);

    // Forced server-side regardless of what the client sent.
    queries.role = "user";
    queries.status = "active";

    const results = await getBloodDonorByGroupAndAreaService(queries);
    res.status(200).send(results);
  },
  // Note: original spelling/casing of `message` and `status` is preserved.
  { message: "Failed to get data ", status: "Failed" },
);
