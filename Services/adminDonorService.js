const Donor = require("../models/Donor");
const { pick } = require("../utils/requestHelpers");

const ADMIN_WRITABLE_FIELDS = [
  "name",
  "number",
  "group",
  "district",
  "area",
  "lastDonation",
  "status",
  "availability",
  "profilePhoto",
  "dateOfBirth",
];

exports.listDonors = async (query, pagination) => {
  const { search, bloodGroup, district, status } = query;
  const { page, limit, sortBy, sortOrder } = pagination;

  const filter = {};
  if (status) filter.status = status;
  if (bloodGroup) filter.group = bloodGroup;
  if (district) filter.district = district;

  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [
      { name: { $regex: regex } },
      { number: { $regex: regex } },
      { email: { $regex: regex } },
    ];
  }

  const total = await Donor.countDocuments(filter);
  const donors = await Donor.find(filter)
    .sort({ [sortBy]: sortOrder })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    data: donors,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

exports.getDonorById = async (id) => Donor.findById(id).lean();

exports.updateDonor = async (id, body, adminEmail) => {
  const updates = pick(body, ADMIN_WRITABLE_FIELDS);
  updates.updatedBy = adminEmail;
  return Donor.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).lean();
};

exports.updateDonorStatus = async (id, status, adminEmail) => {
  return Donor.findByIdAndUpdate(
    id,
    { $set: { status, updatedBy: adminEmail } },
    { new: true, runValidators: true }
  ).lean();
};
