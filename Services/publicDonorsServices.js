const PublicDonors = require("../models/publicDonors");
const DonorQuery = require("../models/donorQuery");
const { pick } = require("../utils/requestHelpers");
const { sendNewDonorEmail } = require("../utils/sendmail/mailer");

/**
 * Fields a client may set when registering as a public donor.
 * `role` is excluded so the schema default ("user") always applies.
 */
const WRITABLE_FIELDS = [
  "number",
  "name",
  "group",
  "district",
  "area",
  "lastDonation",
  "status",
  "gender",
];

exports.WRITABLE_FIELDS = WRITABLE_FIELDS;

exports.createPublicDonorsServices = async (newPublicDonors) => {
  const result = await PublicDonors.create(
    pick(newPublicDonors, WRITABLE_FIELDS),
  );

  // Fire-and-forget: a mail failure must not fail the registration.
  sendNewDonorEmail(result);

  return result;
};

exports.getAllPublicDonorsServices = async (queries) => {
  const result = await PublicDonors.find(queries).lean();

  const { group, district } = queries;

  // Only record searches that actually targeted a district + group. Previously
  // an unfiltered request stored a bogus "undefined = undefined" counter row.
  if (group && district) {
    // One atomic upsert. The old read-then-write pair could create duplicate
    // counter documents when two requests arrived at the same moment.
    await DonorQuery.updateOne(
      { donorQueryByDistrictAndGroup: `${group} = ${district}` },
      {
        $inc: { count: 1 },
        $setOnInsert: { district, group },
      },
      { upsert: true, setDefaultsOnInsert: false },
    );
  }

  // Sorted in JS on purpose: `lastDonation` is stored as a String, so a database
  // sort would be lexicographic instead of chronological.
  return result.sort(
    (a, b) => new Date(a.lastDonation) - new Date(b.lastDonation),
  );
};

exports.updateAreaOrLastDonationDateServices = async (donor) => {
  // A missing body used to throw on property access, which the controller
  // reported as a 400. Preserve that behaviour.
  if (!donor) {
    throw new Error("A JSON request body is required");
  }

  const { number } = donor;

  // Without a number the old filter collapsed to `{}`, which made MongoDB update
  // an arbitrary document. Refuse to touch the database instead.
  if (!number) {
    return undefined;
  }

  if (donor.district) {
    return PublicDonors.updateOne(
      { number },
      { $set: { district: donor.district, area: donor.area } },
      { runValidators: true },
    );
  }

  if (donor.lastDonation) {
    return PublicDonors.updateOne(
      { number },
      { $set: { lastDonation: donor.lastDonation } },
      { runValidators: true },
    );
  }

  return undefined;
};
