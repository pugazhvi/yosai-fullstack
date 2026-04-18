import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { createNotification } from "../services/notification.service.js";
import User from "../models/User.js";
import Inquiry from "../models/Inquiry.js";

const router = Router();

// Contact form submission
router.post("/contact", async (req, res) => {
  try {
    const { name, email, phoneno, message } = req.body;
    if (!name || !email || !message)
      return res.status(400).json({ success: false, message: "Name, email and message are required" });

    const inquiry = await Inquiry.create({ type: "contact", name, email, phone: phoneno, message });

    const admin = await User.findOne({ role: "admin" });
    if (admin) {
      await createNotification({
        userId: admin._id,
        title: "New Contact Message",
        message: `${name} (${email}): ${message.substring(0, 100)}`,
        type: "new_message",
        referenceId: inquiry._id.toString(),
        referenceModel: "Inquiry",
      });
    }

    res.json({ success: true, message: "Message received. We will get back to you shortly." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Callback request
router.post("/callback", async (req, res) => {
  try {
    const { name, phoneno, phone, preferredTime } = req.body;
    const contactPhone = phoneno || phone;
    if (!name || !contactPhone)
      return res.status(400).json({ success: false, message: "Name and phone are required" });

    const inquiry = await Inquiry.create({ type: "callback", name, phone: contactPhone, preferredTime });

    const admin = await User.findOne({ role: "admin" });
    if (admin) {
      await createNotification({
        userId: admin._id,
        title: "Callback Requested",
        message: `${name} (${contactPhone}) requested a callback${preferredTime ? ` at ${preferredTime}` : ""}.`,
        type: "new_message",
        referenceId: inquiry._id.toString(),
        referenceModel: "Inquiry",
      });
    }

    res.json({ success: true, message: "Callback request received. We will call you soon." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Stitch service booking
router.post("/bookings", protect, async (req, res) => {
  try {
    const { serviceType, measurements, fabricDescription, preferredDate, notes } = req.body;

    const inquiry = await Inquiry.create({
      type: "booking",
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      userId: req.user._id,
      serviceType,
      measurements,
      fabricDescription,
      preferredDate,
      notes,
    });

    const admin = await User.findOne({ role: "admin" });
    if (admin) {
      await createNotification({
        userId: admin._id,
        title: "New Stitch Booking",
        message: `${req.user.name} booked ${serviceType} service for ${preferredDate || "any date"}.`,
        type: "new_message",
        referenceId: inquiry._id.toString(),
        referenceModel: "Inquiry",
      });
    }

    await createNotification({
      userId: req.user._id,
      title: "Booking Confirmed",
      message: `Your ${serviceType} service booking has been received. We will confirm shortly.`,
      type: "order_placed",
      referenceId: inquiry._id.toString(),
      referenceModel: "Inquiry",
    });

    res.status(201).json({ success: true, message: "Booking submitted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
