const mongoose = require("mongoose");

const AnalyticsEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      enum: [
        "login",
        "search",
        "blood_request",
        "blood_request_fulfilled",
        "blood_request_cancelled",
        "donor_registration",
        "public_donor_registration",
        "page_view",
        "admin_action",
      ],
      required: true,
      index: true,
    },
    userId: {
      type: String,
      default: "",
      index: true,
    },
    bloodGroup: {
      type: String,
      default: "",
    },
    district: {
      type: String,
      default: "",
    },
    area: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip: {
      type: String,
      default: "",
    },
    deviceInfo: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    expireAfterSeconds: 90 * 24 * 60 * 60,
  }
);

AnalyticsEventSchema.index({ eventType: 1, createdAt: -1 });
AnalyticsEventSchema.index({ district: 1, createdAt: -1 });
AnalyticsEventSchema.index({ bloodGroup: 1, createdAt: -1 });
AnalyticsEventSchema.index({ district: 1, bloodGroup: 1, createdAt: -1 });
AnalyticsEventSchema.index({ userId: 1, createdAt: -1 });

const AnalyticsEvent = mongoose.model(
  "AnalyticsEvent",
  AnalyticsEventSchema,
  "analytics_events"
);

module.exports = AnalyticsEvent;
