const mongoose = require("mongoose");

const DonorShema = mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
    },

    number: {
      type: String,
      trim: true,
      unique: true,
      index: true,
    },
    group: {
      type: String,
      trim: true,
    },

    district: {
      type: String,
      trim: true,
    },
    area: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["super_admin", "admin", "user"],
      default: "user",
    },
    lastDonation: {
      type: String,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    availability: {
      type: Boolean,
      default: true,
    },
    profilePhoto: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: String,
    },
    createdBy: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

// `email` and `number` already carry unique indexes in their field definitions.
// This compound index backs the public lookup used by
// GET /api/v1/donors/public/donorInfo?group=..&district=.. which always adds
// role and status to the filter.
DonorShema.index({ group: 1, district: 1, role: 1, status: 1 });
DonorShema.index({ status: 1, createdAt: -1 });
DonorShema.index({ name: 1 });
DonorShema.index({ district: 1, status: 1 });

const Donor = mongoose.model("Donors", DonorShema, "donors");
module.exports = Donor;
