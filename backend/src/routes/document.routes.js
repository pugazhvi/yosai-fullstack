import { Router } from "express";
import { protect, requireRole } from "../middleware/auth.js";
import {
  getRequiredDocuments, submitVendorDocument, getMyDocuments,
  createDocumentMaster, updateDocumentMaster, getAllDocumentMasters,
  getVendorDocumentsAdmin, verifyVendorDocument, getAllSubmittedDocuments,
} from "../controllers/document.controller.js";

const router = Router();

// Public/Auth
router.get("/required", protect, getRequiredDocuments);

// Vendor
router.post("/submit", protect, requireRole("vendor"), submitVendorDocument);
router.get("/my", protect, requireRole("vendor"), getMyDocuments);

// Admin
router.get("/submitted", protect, requireRole("admin"), getAllSubmittedDocuments);
router.get("/pending", protect, requireRole("admin"), (req, res, next) => { req.query.status = "pending"; getAllSubmittedDocuments(req, res, next); });
router.get("/master", protect, requireRole("admin"), getAllDocumentMasters);
router.post("/master", protect, requireRole("admin"), createDocumentMaster);
router.put("/master/:id", protect, requireRole("admin"), updateDocumentMaster);
router.get("/vendor/:vendorId", protect, requireRole("admin"), getVendorDocumentsAdmin);
router.patch("/vendor/:docId/verify", protect, requireRole("admin"), verifyVendorDocument);

export default router;
