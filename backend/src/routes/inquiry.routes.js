import { Router } from "express";
import { protect, requireRole } from "../middleware/auth.js";
import Inquiry from "../models/Inquiry.js";

const router = Router();
router.use(protect, requireRole("admin"));

// Get all inquiries with optional filters
router.get("/", async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = {};
    if (type && type !== "all") filter.type = type;
    if (status && status !== "all") filter.status = status;
    const inquiries = await Inquiry.find(filter)
      .populate("userId", "name email phone")
      .sort("-createdAt");
    res.json({ success: true, data: inquiries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get counts by type
router.get("/stats", async (req, res) => {
  try {
    const [total, newCount, contacts, callbacks, bookings] = await Promise.all([
      Inquiry.countDocuments(),
      Inquiry.countDocuments({ status: "new" }),
      Inquiry.countDocuments({ type: "contact" }),
      Inquiry.countDocuments({ type: "callback" }),
      Inquiry.countDocuments({ type: "booking" }),
    ]);
    res.json({ success: true, data: { total, new: newCount, contacts, callbacks, bookings } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update status / add admin note
router.patch("/:id", async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const update = {};
    if (status) update.status = status;
    if (adminNote !== undefined) update.adminNote = adminNote;
    if (status === "replied") update.repliedAt = new Date();
    const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!inquiry) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: inquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete
router.delete("/:id", async (req, res) => {
  try {
    await Inquiry.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
