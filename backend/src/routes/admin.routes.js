import { Router } from "express";
import { protect, requireRole } from "../middleware/auth.js";
import {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  getAllVendors,
  getVendorDetail,
  updateVendorStatus,
  verifyKycDocument,
  getAllProducts,
  updateProductStatus,
  getCommissions,
  createCommission,
  updateCommission,
  getAllOrders,
  getPayoutRequests,
  approvePayoutRequest,
  rejectPayoutRequest,
  getShippingStats,
} from "../controllers/admin.controller.js";

const router = Router();
router.use(protect, requireRole("admin"));

// Dashboard
router.get("/dashboard", getDashboardStats);

// Users
router.get("/users", getAllUsers);
router.patch("/users/:id/status", updateUserStatus);

// Vendors
router.get("/vendors", getAllVendors);
router.get("/vendors/:id", getVendorDetail);
router.patch("/vendors/:id/status", updateVendorStatus);
router.patch("/vendors/:vendorId/kyc-documents/:docIndex", verifyKycDocument);

// Products
router.get("/products", getAllProducts);
router.patch("/products/:id/status", updateProductStatus);

// Commissions (also accessible via /admin/commissions)
router.get("/commissions", getCommissions);
router.post("/commissions", createCommission);
router.patch("/commissions/:id", updateCommission);

// Orders
router.get("/orders", getAllOrders);

// Payouts
router.get("/payouts", getPayoutRequests);
router.patch("/payouts/:id/approve", approvePayoutRequest);
router.patch("/payouts/:id/reject", rejectPayoutRequest);

// Shipping
router.get("/shipping/stats", getShippingStats);

export default router;
