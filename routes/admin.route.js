const express = require("express");
const router = express.Router();
const { verifyFirebaseToken } = require("../middleware/verifyFirebaseToken");
const adminOnly = require("../middleware/adminOnly");
const superAdminOnly = require("../middleware/superAdminOnly");
const parsePagination = require("../middleware/pagination");
const validateAdminBody = require("../middleware/validateAdminBody");

// Apply auth middleware to ALL admin routes
router.use(verifyFirebaseToken);
router.use(adminOnly);

// Dashboard
const dashboardController = require("../Controllers/adminDashboard.Controller");
router.get("/dashboard/stats", dashboardController.getDashboardStats);

// Public Donors CRUD
const publicDonorController = require("../Controllers/adminPublicDonor.Controller");
router.get("/public-donors", parsePagination, publicDonorController.list);
router.get("/public-donors/:id", publicDonorController.getById);
router.put(
  "/public-donors/:id",
  validateAdminBody([
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
  ]),
  publicDonorController.update
);
router.delete("/public-donors/:id", superAdminOnly, publicDonorController.remove);

// Registered Donors CRUD — super_admin only
const donorController = require("../Controllers/adminDonor.Controller");
router.get("/donors", superAdminOnly, parsePagination, donorController.list);
router.get("/donors/:id", superAdminOnly, donorController.getById);
router.put(
  "/donors/:id",
  superAdminOnly,
  validateAdminBody([
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
  ]),
  donorController.update
);
router.patch("/donors/:id/status", superAdminOnly, donorController.updateStatus);

// Blood Requests CRUD
const bloodRequestController = require("../Controllers/adminBloodRequest.Controller");
router.get(
  "/blood-requests",
  parsePagination,
  bloodRequestController.list
);
router.get("/blood-requests/:id", bloodRequestController.getById);
router.put(
  "/blood-requests/:id",
  validateAdminBody([
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
  ]),
  bloodRequestController.update
);
router.delete("/blood-requests/:id", bloodRequestController.remove);

// Audit Logs — super_admin only
const auditLogController = require("../Controllers/auditLog.Controller");
router.get("/audit-logs", superAdminOnly, parsePagination, auditLogController.list);

// Analytics — super_admin only
const analyticsController = require("../Controllers/analytics.Controller");
router.get("/analytics", superAdminOnly, analyticsController.getAnalytics);

// Donor Query Stats — super_admin only
const donorQueryAdminController = require("../Controllers/donorQueryAdmin.Controller");
router.get("/donor-query", superAdminOnly, donorQueryAdminController.getStats);

// Demand Analytics — super_admin only
const analyticsDashboardController = require("../Controllers/analyticsDashboard.Controller");
router.get("/analytics/overview", superAdminOnly, analyticsDashboardController.getOverview);
router.get("/analytics/blood-demand", superAdminOnly, analyticsDashboardController.getBloodDemand);
router.get("/analytics/areas", superAdminOnly, analyticsDashboardController.getLocationAnalytics);
router.get("/analytics/time", superAdminOnly, analyticsDashboardController.getTimeAnalytics);
router.get("/analytics/user-activity", superAdminOnly, analyticsDashboardController.getUserActivity);

// Predictions — super_admin only
const predictionController = require("../Controllers/prediction.Controller");
router.get("/predictions/blood-demand", superAdminOnly, predictionController.getBloodDemandPredictions);
router.get("/predictions/areas", superAdminOnly, predictionController.getAreaPredictions);
router.get("/predictions/summary", superAdminOnly, predictionController.getSummary);

// Settings — super_admin only
const adminSettingController = require("../Controllers/adminSetting.Controller");
router.get("/settings", superAdminOnly, adminSettingController.getSettings);
router.put("/settings", superAdminOnly, adminSettingController.updateSetting);

// AI Service — super_admin only
const aiController = require("../Controllers/ai.Controller");
router.get("/ai/providers", superAdminOnly, aiController.getProviderStatus);
router.post("/ai/test-connection", superAdminOnly, aiController.testConnection);
router.get("/ai/usage-stats", superAdminOnly, aiController.getUsageStats);

module.exports = router;
