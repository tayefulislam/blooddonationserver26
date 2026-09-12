const BloodRequest = require("../models/bloodRequests");
const { pick } = require("../utils/requestHelpers");

const ADMIN_WRITABLE_FIELDS = [
  "patient",
  "medical",
  "unit",
  "number",
  "group",
  "date",
  "time",
  "type",
  "district",
  "area",
  "comment",
  "status",
];

exports.listBloodRequests = async (query, pagination) => {
  const { search, bloodGroup, district, status } = query;
  const { page, limit, sortBy, sortOrder } = pagination;

  const filter = {};
  if (status) filter.status = status;
  if (bloodGroup) filter.group = bloodGroup;
  if (district) filter.district = district;

  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [
      { patient: { $regex: regex } },
      { number: { $regex: regex } },
    ];
  }

  const total = await BloodRequest.countDocuments(filter);
  const requests = await BloodRequest.find(filter)
    .sort({ [sortBy]: sortOrder })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    data: requests,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

exports.getBloodRequestById = async (id) => BloodRequest.findById(id).lean();

exports.updateBloodRequest = async (id, body, adminEmail) => {
  const updates = pick(body, ADMIN_WRITABLE_FIELDS);
  updates.updatedBy = adminEmail;
  return BloodRequest.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).lean();
};

exports.deleteBloodRequest = async (id) => BloodRequest.findByIdAndDelete(id).lean();
