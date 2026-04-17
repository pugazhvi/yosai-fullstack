import User from "../models/User.js";
import Vendor from "../models/Vendor.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Commission from "../models/Commission.js";
import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import PayoutRequest from "../models/PayoutRequest.js";
import { createPickupLocation } from "../services/shiprocket.service.js";
import { createNotification } from "../services/notification.service.js";
import { creditWallet, debitWallet } from "../services/wallet.service.js";

// Dashboard Stats
export const getDashboardStats = async (req, res) => {
  try {
    const [totalVendors, pendingVendors, totalProducts, pendingProducts, totalOrders, totalCustomers, totalRevenue, pendingPayouts] = await Promise.all([
      Vendor.countDocuments(),
      Vendor.countDocuments({ status: "pending" }),
      Product.countDocuments(),
      Product.countDocuments({ status: "pending_approval" }),
      Order.countDocuments(),
      User.countDocuments({ role: "customer" }),
      Order.aggregate([{ $match: { "payment.status": "paid" } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
      PayoutRequest.countDocuments({ status: "pending" }),
    ]);
    const commission = await Order.aggregate([
      { $unwind: "$subOrders" },
      { $group: { _id: null, total: { $sum: "$subOrders.commission.amount" } } },
    ]);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyRevenue = await Order.aggregate([
      { $match: { "payment.status": "paid", createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, revenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    const recentOrders = await Order.find().populate("customerId", "name email").sort("-createdAt").limit(5).select("orderNumber totalAmount status createdAt customerId");
    res.json({
      success: true,
      data: {
        totalVendors, pendingVendors, totalProducts, pendingProducts, totalOrders, totalCustomers,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalCommission: commission[0]?.total || 0,
        pendingPayouts, monthlyRevenue, recentOrders,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// User Management
export const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
    const users = await User.find(filter).select("-password").sort("-createdAt").skip((page - 1) * limit).limit(Number(limit));
    const total = await User.countDocuments(filter);
    res.json({ success: true, data: users, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Vendor Management
export const getAllVendors = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const vendors = await Vendor.find(filter).populate("userId", "name email phone").sort("-createdAt").skip((page - 1) * limit).limit(Number(limit));
    const total = await Vendor.countDocuments(filter);
    res.json({ success: true, data: vendors, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getVendorDetail = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id).populate("userId", "name email phone createdAt");
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });
    const products = await Product.find({ vendorId: vendor._id }).select("name status images createdAt").limit(10);
    const orders = await Order.countDocuments({ "subOrders.vendorId": vendor._id });
    const wallet = await Wallet.findOne({ ownerId: vendor._id, ownerType: "vendor" });
    res.json({ success: true, data: { vendor, products, totalOrders: orders, walletBalance: wallet?.balance || 0 } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const verifyKycDocument = async (req, res) => {
  try {
    const { vendorId, docIndex } = req.params;
    const { status } = req.body;
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });
    if (!vendor.kyc?.documents?.[docIndex]) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }
    vendor.kyc.documents[docIndex].status = status;
    await vendor.save();
    res.json({ success: true, data: vendor.kyc.documents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateVendorStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, { status, adminNote }, { new: true }).populate("userId");
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });
    if (status === "approved") {
      try {
        const result = await createPickupLocation(vendor);
        if (result.pickup_location) {
          vendor.shiprocket.pickupLocationName = result.pickup_location;
          await vendor.save();
        }
      } catch (e) { console.log("Shiprocket pickup creation failed:", e.message); }
    }
    await createNotification({
      userId: vendor.userId._id,
      title: status === "approved" ? "Vendor Approved!" : `Vendor ${status}`,
      message: adminNote || `Your vendor account has been ${status}.`,
      type: "kyc_update",
      referenceId: vendor._id.toString(),
    });
    res.json({ success: true, data: vendor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Product Management
export const getAllProducts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const products = await Product.find(filter)
      .populate("vendorId", "brandName")
      .populate("category", "name")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Product.countDocuments(filter);
    res.json({ success: true, data: products, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateProductStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const product = await Product.findByIdAndUpdate(req.params.id, { status, adminNote }, { new: true }).populate("vendorId");
    await createNotification({
      userId: product.vendorId.userId,
      title: status === "approved" ? "Product Approved!" : "Product Rejected",
      message: adminNote || `Your product "${product.name}" has been ${status}.`,
      type: status === "approved" ? "product_approved" : "product_rejected",
      referenceId: product._id.toString(),
    });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Commission Management
export const getCommissions = async (req, res) => {
  try {
    const commissions = await Commission.find()
      .populate("vendorId", "brandName")
      .populate("categoryId", "name")
      .sort("-createdAt");
    res.json({ success: true, data: commissions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createCommission = async (req, res) => {
  try {
    if (req.body.isDefault) await Commission.updateMany({}, { isDefault: false });
    const commission = await Commission.create(req.body);
    res.status(201).json({ success: true, data: commission });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateCommission = async (req, res) => {
  try {
    if (req.body.isDefault) await Commission.updateMany({}, { isDefault: false });
    const commission = await Commission.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: commission });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Payout Management
export const getPayoutRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const payouts = await PayoutRequest.find(filter)
      .populate({ path: "vendorId", select: "brandName userId", populate: { path: "userId", select: "name email" } })
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await PayoutRequest.countDocuments(filter);
    res.json({ success: true, data: payouts, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const approvePayoutRequest = async (req, res) => {
  try {
    const { adminNote } = req.body;
    const payout = await PayoutRequest.findById(req.params.id).populate("vendorId");
    if (!payout) return res.status(404).json({ success: false, message: "Payout request not found" });
    if (payout.status !== "pending") return res.status(400).json({ success: false, message: "Payout already processed" });
    const txn = await debitWallet({
      ownerId: payout.vendorId._id,
      ownerType: "vendor",
      amount: payout.amount,
      reason: "payout",
      referenceId: payout._id.toString(),
      note: "Payout approved by admin",
    });
    payout.status = "approved";
    payout.adminNote = adminNote;
    payout.processedAt = new Date();
    payout.processedBy = req.user._id;
    payout.transactionRef = txn._id;
    await payout.save();
    await createNotification({
      userId: payout.vendorId.userId,
      title: "Payout Processed",
      message: `\u20B9${payout.amount} has been transferred to your bank account.`,
      type: "payout_processed",
      referenceId: payout._id.toString(),
    });
    res.json({ success: true, data: payout });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const rejectPayoutRequest = async (req, res) => {
  try {
    const { adminNote } = req.body;
    const payout = await PayoutRequest.findById(req.params.id).populate("vendorId");
    if (!payout) return res.status(404).json({ success: false, message: "Payout request not found" });
    if (payout.status !== "pending") return res.status(400).json({ success: false, message: "Payout already processed" });
    payout.status = "rejected";
    payout.adminNote = adminNote;
    payout.processedAt = new Date();
    payout.processedBy = req.user._id;
    await payout.save();
    await createNotification({
      userId: payout.vendorId.userId,
      title: "Payout Rejected",
      message: adminNote || `Your payout request of \u20B9${payout.amount} was rejected.`,
      type: "payout_processed",
      referenceId: payout._id.toString(),
    });
    res.json({ success: true, data: payout });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// All Orders
export const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const orders = await Order.find(filter)
      .populate("customerId", "name email")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Order.countDocuments(filter);
    res.json({ success: true, data: orders, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Shipping Dashboard
export const getShippingStats = async (req, res) => {
  try {
    const pipeline = [
      { $unwind: "$subOrders" },
      { $group: { _id: "$subOrders.status", count: { $sum: 1 } } },
    ];
    const stats = await Order.aggregate(pipeline);
    const delayed = await Order.countDocuments({ "subOrders.isDelayed": true });
    res.json({ success: true, data: { byStatus: stats, delayed } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
