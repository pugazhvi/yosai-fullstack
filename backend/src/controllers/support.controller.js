import SupportTicket from "../models/SupportTicket.js";
import User from "../models/User.js";
import { createNotification } from "../services/notification.service.js";

const notifyAdmins = async ({ title, message, referenceId }) => {
  const admins = await User.find({ role: "admin" }).select("_id");
  await Promise.all(admins.map((a) =>
    createNotification({
      userId: a._id,
      title,
      message,
      type: "new_message",
      referenceId,
      referenceModel: "SupportTicket",
    })
  ));
};

// Create ticket (customer/vendor)
export const createTicket = async (req, res) => {
  try {
    const { subject, description, category, priority, orderId, attachment } = req.body;
    if (!subject || !description) return res.status(400).json({ success: false, message: "Subject and description required" });

    const ticket = await SupportTicket.create({
      userId: req.user._id,
      subject, description, category, priority, orderId, attachment,
    });

    await notifyAdmins({
      title: "New Support Ticket",
      message: `${req.user.name || "A user"} raised a ticket: ${subject}`,
      referenceId: ticket._id.toString(),
    });

    res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get my tickets
export const getMyTickets = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { userId: req.user._id };
    if (status) filter.status = status;
    const tickets = await SupportTicket.find(filter).sort("-createdAt").skip((page - 1) * limit).limit(Number(limit)).select("-replies");
    const total = await SupportTicket.countDocuments(filter);
    res.json({ success: true, data: tickets, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get ticket detail
export const getTicketDetail = async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({ _id: req.params.id, userId: req.user._id })
      .populate("replies.senderId", "name role avatar")
      .populate("assignedTo", "name");
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Add reply to ticket
export const addReply = async (req, res) => {
  try {
    const { message, attachment } = req.body;
    if (!message) return res.status(400).json({ success: false, message: "Message required" });
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

    // Customer/vendor can only reply to their own tickets
    if (req.user.role !== "admin" && ticket.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });

    ticket.replies.push({ senderId: req.user._id, senderRole: req.user.role, message, attachment });
    if (ticket.status === "open") ticket.status = "in_progress";
    await ticket.save();

    const preview = message.length > 80 ? `${message.substring(0, 80)}…` : message;
    if (req.user.role === "admin") {
      await createNotification({
        userId: ticket.userId,
        title: "Support Team Replied",
        message: `Ticket ${ticket.ticketNumber}: ${preview}`,
        type: "new_message",
        referenceId: ticket._id.toString(),
        referenceModel: "SupportTicket",
      });
    } else {
      await notifyAdmins({
        title: "New Reply on Ticket",
        message: `${req.user.name || "User"} replied on ${ticket.ticketNumber}: ${preview}`,
        referenceId: ticket._id.toString(),
      });
    }

    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: Get all tickets
export const getAllTickets = async (req, res) => {
  try {
    const { status, priority, category, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    const tickets = await SupportTicket.find(filter)
      .populate("userId", "name email role")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select("-replies");
    const total = await SupportTicket.countDocuments(filter);
    res.json({ success: true, data: tickets, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: Get ticket detail (any ticket)
export const getTicketDetailAdmin = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate("userId", "name email role phone")
      .populate("replies.senderId", "name role avatar")
      .populate("assignedTo", "name");
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: Update ticket status/assignment
export const updateTicket = async (req, res) => {
  try {
    const { status, assignedTo, priority } = req.body;
    const update = {};
    if (status) {
      update.status = status;
      if (status === "resolved") update.resolvedAt = new Date();
      if (status === "closed") update.closedAt = new Date();
    }
    if (assignedTo) update.assignedTo = assignedTo;
    if (priority) update.priority = priority;

    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate("userId", "name email");

    if (ticket && status) {
      await createNotification({
        userId: ticket.userId._id,
        title: `Ticket ${status.replace("_", " ")}`,
        message: `Your support ticket ${ticket.ticketNumber} has been marked as ${status.replace("_", " ")}.`,
        type: "new_message",
        referenceId: ticket._id.toString(),
        referenceModel: "SupportTicket",
      });
    }

    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
