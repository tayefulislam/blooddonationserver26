const mongoose = require("mongoose");
const bloodRequestSchema = mongoose.Schema(
  {
    patient: {
      type: String,
      trim: true,
      required: [true, "Please Enter Patient Name"],
    },
    medical: {
      type: String,
      trim: true,
      required: [true, "Please Enter Patient Medical Name"],
    },
    unit: {
      type: String,
      trim: true,
      required: [true, "Please Enter unit number"],
    },

    number: {
      type: String,
      trim: true,
      required: [true, "Please Enter Phone Number"],
    },
    group: {
      type: String,
      trim: true,
      required: [true, "Please Select Blood Group"],
    },
    date: {
      type: String,
      trim: true,
      required: [true, "Please Select A Date"],
    },
    time: {
      type: String,
      trim: true,
      required: [true, "Please selete a time"],
    },
    type: {
      type: String,
      trim: true,
      required: [true, "Please selete a blood type"],
    },
    district: {
      type: String,
      trim: true,
      required: [true, "Please select your district Name"],
    },
    area: {
      type: String,
      trim: true,
      required: [true, "Please write down your address"],
    },
    comment: {
      type: String,
      trim: true,
      required: [true, "Please write down your comment"],
    },
    status: {
      type: String,
      enum: ["open", "fulfilled", "cancelled", "closed"],
      default: "open",
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

// Backs GET /api/v1/bloodRequest?group=..&district=..
// A compound index serves both the `group` and `group+district` filters, while
// the single-field index covers `district` on its own.
bloodRequestSchema.index({ group: 1, district: 1 });
bloodRequestSchema.index({ district: 1 });
bloodRequestSchema.index({ status: 1 });
bloodRequestSchema.index({ group: 1, status: 1 });
bloodRequestSchema.index({ createdAt: -1 });

const bloodRequests = mongoose.model(
  "bloodRequests",
  bloodRequestSchema,
  "bloodRequests",
);
module.exports = bloodRequests;
