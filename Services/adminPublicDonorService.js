const PublicDonor = require("../models/publicDonors");
const { pick } = require("../utils/requestHelpers");

const ADMIN_WRITABLE_FIELDS = [
  "number",
  "name",
  "group",
  "district",
  "area",
  "lastDonation",
  "status",
  "gender",
  "alternativePhone",
  "address",
  "dateOfBirth",
  "availability",
  "profilePhoto",
];

exports.listPublicDonors = async (query, pagination) => {
  const { search, bloodGroup, district, area, status } = query;
  const { page, limit, sortBy, sortOrder } = pagination;

  const filter = {};
  if (status) filter.status = status;
  if (bloodGroup) filter.group = bloodGroup;
  if (district) filter.district = district;
  if (area) filter.area = area;

  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [
      { name: { $regex: regex } },
      { number: { $regex: regex } },
    ];
  }

  const total = await PublicDonor.countDocuments(filter);
  const donors = await PublicDonor.find(filter)
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

exports.getPublicDonorById = async (id) => PublicDonor.findById(id).lean();

exports.updatePublicDonor = async (id, body, adminEmail) => {
  const updates = pick(body, ADMIN_WRITABLE_FIELDS);
  updates.updatedBy = adminEmail;
  return PublicDonor.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).lean();
};

exports.deletePublicDonor = async (id) => PublicDonor.findByIdAndDelete(id).lean();
