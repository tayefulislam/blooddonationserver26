const Donor = require("../models/Donor");
const PublicDonor = require("../models/publicDonors");
const BloodRequest = require("../models/bloodRequests");

const normalizeGroup = (raw) => {
  if (!raw) return "unknown";
  const up = raw.toUpperCase().trim();
  if (up.includes("AB")) return up.includes("-") ? "AB-" : "AB+";
  if (up.includes("A ") || up.startsWith("A")) return up.includes("-") ? "A-" : "A+";
  if (up.includes("B ") || up.startsWith("B")) return up.includes("-") ? "B-" : "B+";
  if (up.includes("O ") || up.startsWith("O")) return up.includes("-") ? "O-" : "O+";
  return raw;
};

const formatByField = (arr) => {
  const map = {};
  for (const item of arr) {
    const key = normalizeGroup(item._id);
    map[key] = (map[key] || 0) + item.count;
  }
  return map;
};

exports.getDashboardStats = async () => {
  const [
    totalDonors,
    donorsByStatus,
    donorsByGroup,
    totalPublicDonors,
    publicDonorsByStatus,
    publicDonorsByGroup,
    totalBloodRequests,
    requestsByStatus,
    requestsByGroup,
  ] = await Promise.all([
    Donor.countDocuments(),
    Donor.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Donor.aggregate([{ $group: { _id: "$group", count: { $sum: 1 } } }]),
    PublicDonor.countDocuments(),
    PublicDonor.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    PublicDonor.aggregate([{ $group: { _id: "$group", count: { $sum: 1 } } }]),
    BloodRequest.countDocuments(),
    BloodRequest.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    BloodRequest.aggregate([{ $group: { _id: "$group", count: { $sum: 1 } } }]),
  ]);

  return {
    donors: {
      total: totalDonors,
      byStatus: formatByField(donorsByStatus),
      byGroup: formatByField(donorsByGroup),
    },
    publicDonors: {
      total: totalPublicDonors,
      byStatus: formatByField(publicDonorsByStatus),
      byGroup: formatByField(publicDonorsByGroup),
    },
    bloodRequests: {
      total: totalBloodRequests,
      byStatus: formatByField(requestsByStatus),
      byGroup: formatByField(requestsByGroup),
    },
  };
};
