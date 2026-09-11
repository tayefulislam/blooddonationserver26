const Donor = require("../models/Donor");
const { pick } = require("../utils/requestHelpers");

/**
 * Fields a client is allowed to write on a donor.
 *
 * `role` is deliberately excluded: it can only be changed through
 * `changeRoleService`. As written before, any signup/profile payload could set
 * `role: "admin"` and promote itself.
 */
const WRITABLE_FIELDS = [
  "email",
  "name",
  "number",
  "group",
  "district",
  "area",
  "lastDonation",
  "status",
];

exports.WRITABLE_FIELDS = WRITABLE_FIELDS;

exports.createDonorService = async (newDonor) =>
  Donor.create(pick(newDonor, WRITABLE_FIELDS));

exports.updateDonorProfileService = async (filter, donor) =>
  Donor.updateOne(
    filter,
    { $set: pick(donor, WRITABLE_FIELDS) },
    { upsert: true, runValidators: true },
  );

exports.donorInfoService = async (email) => Donor.findOne({ email }).lean();

exports.getAllDonorInfoService = async (email, queries) => {
  const adminInfo = await Donor.findOne({ email }).lean();

  // Previously a missing admin crashed with a TypeError
  // ("Cannot read properties of null"), which the controller masked as a 400.
  // Keep the 400 but report something meaningful.
  if (!adminInfo) {
    throw new Error(`No donor found for email "${email}"`);
  }

  // Non-admins keep the original contract: an empty list, HTTP 200.
  if (adminInfo.role !== "admin") {
    return [];
  }

  if (queries.search) {
    return Donor.aggregate([
      {
        $search: {
          index: "donorInfo",
          text: {
            query: queries.search,
            path: { wildcard: "*" },
            fuzzy: {},
          },
        },
      },
    ]).sort({ _id: -1 });
  }

  return Donor.find().sort({ _id: -1 }).lean();
};

exports.changeRoleService = async (email) =>
  Donor.updateOne(
    { email },
    { $set: { role: "admin" } },
    { runValidators: true },
  );

exports.getBloodDonorByGroupAndAreaService = async (queries) =>
  Donor.find(queries).lean();
