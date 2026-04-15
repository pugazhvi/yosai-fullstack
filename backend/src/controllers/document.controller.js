import DocumentMaster, { VendorDocument } from "../models/DocumentMaster.js";
import Vendor from "../models/Vendor.js";

// Get required documents for a role
export const getRequiredDocuments = async (req, res) => {
  try {
    const { role = "vendor" } = req.query;
    const docs = await DocumentMaster.find({ applicableRoles: role, isActive: true }).sort("sortOrder");
    res.json({ success: true, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Upload/submit vendor document
export const submitVendorDocument = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });

    const { documentId, fileUrl, fileName, identificationNumber } = req.body;
    // Upsert - if document for this master doc already exists, update it
    const existing = await VendorDocument.findOne({ vendorId: vendor._id, documentId });
    if (existing) {
      existing.fileUrl = fileUrl;
      existing.fileName = fileName;
      existing.identificationNumber = identificationNumber;
      existing.verificationStatus = "submitted";
      existing.adminComment = null;
      await existing.save();
      return res.json({ success: true, data: existing });
    }

    const doc = await VendorDocument.create({ vendorId: vendor._id, documentId, fileUrl, fileName, identificationNumber });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get my submitted documents
export const getMyDocuments = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });
    const docs = await VendorDocument.find({ vendorId: vendor._id }).populate("documentId", "documentName documentCode documentType isRequired");
    res.json({ success: true, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: CRUD document master
export const createDocumentMaster = async (req, res) => {
  try {
    const doc = await DocumentMaster.create(req.body);
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateDocumentMaster = async (req, res) => {
  try {
    const doc = await DocumentMaster.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllDocumentMasters = async (req, res) => {
  try {
    const docs = await DocumentMaster.find().sort("sortOrder");
    res.json({ success: true, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: Get all submitted documents across vendors (with optional status filter)
export const getAllSubmittedDocuments = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== "all") {
      if (status === "pending") filter.verificationStatus = { $in: ["submitted", "pending"] };
      else filter.verificationStatus = status;
    }
    const docs = await VendorDocument.find(filter)
      .populate({
        path: "vendorId",
        select: "brandName userId",
        populate: { path: "userId", select: "name email phone" },
      })
      .populate("documentId", "documentName documentCode documentType isRequired")
      .sort("-createdAt");
    res.json({ success: true, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: Get vendor's documents for review
export const getVendorDocumentsAdmin = async (req, res) => {
  try {
    const docs = await VendorDocument.find({ vendorId: req.params.vendorId })
      .populate("documentId", "documentName documentCode documentType isRequired");
    res.json({ success: true, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: Verify/approve vendor document
export const verifyVendorDocument = async (req, res) => {
  try {
    const { verificationStatus, adminComment } = req.body;
    const doc = await VendorDocument.findByIdAndUpdate(
      req.params.docId,
      { verificationStatus, adminComment, verifiedBy: req.user._id, verifiedAt: new Date() },
      { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
