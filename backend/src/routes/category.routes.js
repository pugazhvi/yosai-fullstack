import { Router } from "express";
import Category from "../models/Category.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = Router();
router.get("/", async (req, res) => {
  const cats = await Category.find({ isActive: true }).sort("sortOrder");
  res.json({ success: true, data: cats });
});
router.post("/", protect, requireRole("admin"), async (req, res) => {
  const cat = await Category.create(req.body);
  res.status(201).json({ success: true, data: cat });
});

router.post("/request", protect, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(200).json({ success: true, data: existing });
    }
    const cat = await Category.create({ name: name.trim(), slug, isActive: true });
    res.status(201).json({ success: true, data: cat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.put("/:id", protect, requireRole("admin"), async (req, res) => {
  const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: cat });
});
router.delete("/:id", protect, requireRole("admin"), async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Deleted" });
});
export default router;
