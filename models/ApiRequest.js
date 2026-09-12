const mongoose = require("mongoose");

const ApiRequestSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    statusCode: {
      type: Number,
    },
    durationMs: {
      type: Number,
    },
    ip: {
      type: String,
      default: "",
    },
    userEmail: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

ApiRequestSchema.index({ createdAt: -1 });
ApiRequestSchema.index({ path: 1 });
ApiRequestSchema.index({ userEmail: 1 });

const ApiRequest = mongoose.model("ApiRequests", ApiRequestSchema, "api_requests");
module.exports = ApiRequest;
