import { Router } from "express";
import { protect, requireRole } from "../middleware/auth.js";
import {
  createTicket, getMyTickets, getTicketDetail, addReply,
  getAllTickets, getTicketDetailAdmin, updateTicket,
} from "../controllers/support.controller.js";

const router = Router();

// Customer/Vendor
router.post("/tickets", protect, createTicket);
router.get("/tickets", protect, getMyTickets);
router.get("/tickets/:id", protect, getTicketDetail);
router.post("/tickets/:id/reply", protect, addReply);

// Admin
router.get("/admin/tickets", protect, requireRole("admin"), getAllTickets);
router.get("/admin/tickets/:id", protect, requireRole("admin"), getTicketDetailAdmin);
router.patch("/admin/tickets/:id", protect, requireRole("admin"), updateTicket);
router.post("/admin/tickets/:id/reply", protect, requireRole("admin"), addReply);

export default router;
