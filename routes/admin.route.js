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

module.exports = router;
