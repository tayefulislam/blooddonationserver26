const mongoose = require("mongoose");

const PublicDonorsSchema = mongoose.Schema(
  {
    number: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      trim: true,
      required: true,
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
      enum: ["admin", "user"],
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
    gender: {
      type: String,
      trim: true,
    },
    alternativePhone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: String,
    },
    availability: {
      type: Boolean,
      default: true,
    },
    profilePhoto: {
      type: String,
      trim: true,
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
  {
    timestamps: true,
  },
);

// GET /api/v2/publicDonors always filters on status + gender, and optionally on
// group + district.
PublicDonorsSchema.index({ status: 1, gender: 1, group: 1, district: 1 });
PublicDonorsSchema.index({ name: 1 });
PublicDonorsSchema.index({ district: 1, status: 1 });
PublicDonorsSchema.index({ group: 1, status: 1 });
PublicDonorsSchema.index({ status: 1, createdAt: -1 });

const PublicDonors = mongoose.model(
  "PublicDonors",
  PublicDonorsSchema,
  "PublicDonors",
);

module.exports = PublicDonors;
