import Razorpay from "razorpay";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Vendor from "../models/Vendor.js";
import { splitAndCreateOrder } from "../services/order.service.js";
import { creditWallet } from "../services/wallet.service.js";
import { createNotification } from "../services/notification.service.js";
import { createShipment, assignAWB, schedulePickup } from "../services/shiprocket.service.js";
import crypto from "crypto";

let _razorpay;
const getRazorpay = () => {
  if (!_razorpay) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) throw new Error("Razorpay credentials not configured in .env");
    _razorpay = new Razorpay({ key_id, key_secret });
  }
  return _razorpay;
};

export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: "Invalid amount" });

    const options = {
      amount: Math.round(amount * 100), // paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    };

    const order = await getRazorpay().orders.create(options);
    res.json({ success: true, orderId: order.id, amount: order.amount, currency: order.currency, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const verifyAndPlaceOrder = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, cartId, shippingAddress, walletAmount = 0, paymentMethod = "online" } = req.body;

    const isCOD = paymentMethod === "cod";

    // Verify Razorpay signature (skip for COD)
    if (!isCOD) {
      const body = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "test").update(body).digest("hex");
      if (razorpaySignature && expected !== razorpaySignature)
        return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    const cart = await Cart.findOne({ cartId }).populate({ path: "items.productId", select: "name images vendorId" });
    if (!cart?.items?.length) return res.status(400).json({ success: false, message: "Cart is empty" });

    const cartItems = cart.items.map((i) => ({
      productId: i.productId._id,
      variantId: i.variantId,
      vendorId: i.vendorId,
      name: i.name,
      image: i.image,
      price: i.price,
      mrp: i.mrp,
      quantity: i.quantity,
      selectedSize: i.selectedSize,
      selectedColor: i.selectedColor,
    }));

    const totalAmount = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const order = await splitAndCreateOrder(
      req.user._id,
      cartItems,
      {
        razorpayOrderId: isCOD ? null : razorpayOrderId,
        razorpayPaymentId: isCOD ? null : razorpayPaymentId,
        razorpaySignature: isCOD ? null : razorpaySignature,
        amount: totalAmount - walletAmount,
        method: isCOD ? "cod" : "online",
        status: isCOD ? "pending" : "paid",
      },
      shippingAddress,
      walletAmount
    );

    await Cart.findOneAndDelete({ cartId });

    await createNotification({
      userId: req.user._id,
      title: "Order Placed!",
      message: `Your order ${order.orderId} has been placed successfully.`,
      type: "order_placed",
      referenceId: order.orderId,
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user._id })
      .populate("subOrders.vendorId", "brandName logo")
      .sort("-createdAt");
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getOrderDetail = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId, customerId: req.user._id })
      .populate("subOrders.vendorId", "brandName logo phone");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getVendorOrders = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    const { status, page = 1, limit = 20 } = req.query;

    const orders = await Order.find({ "subOrders.vendorId": vendor._id })
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const mapped = orders.map((o) => ({
      ...o.toObject(),
      subOrders: o.subOrders.filter((s) => s.vendorId.toString() === vendor._id.toString()),
    }));

    const filtered = status ? mapped.filter((o) => o.subOrders.some((s) => s.status === status)) : mapped;
    res.json({ success: true, data: filtered });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateSubOrderStatus = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    const { subOrderId, status, note } = req.body;
    const order = await Order.findOne({ "subOrders.subOrderId": subOrderId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    const sub = order.subOrders.find((s) => s.subOrderId === subOrderId);
    if (sub.vendorId.toString() !== vendor._id.toString())
      return res.status(403).json({ success: false, message: "Not your order" });

    sub.status = status;
    sub.statusHistory.push({ status, note });

    if (status === "delivered") {
      await creditWallet({ ownerId: vendor._id, ownerType: "vendor", amount: sub.vendorEarning, reason: "order_earning", referenceId: subOrderId });
      sub.payoutStatus = "pending";
      await createNotification({
        userId: req.user._id,
        title: "Earnings Credited",
        message: `₹${sub.vendorEarning} credited to your wallet for order ${subOrderId}`,
        type: "order_delivered",
        referenceId: subOrderId,
      });
    }

    await order.save();
    res.json({ success: true, data: sub });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Shiprocket actions — called by vendor
export const createSubOrderShipment = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    const { orderId, subOrderId } = req.params;
    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const sub = order.subOrders.find((s) => s.subOrderId === subOrderId);
    if (!sub) return res.status(404).json({ success: false, message: "Sub-order not found" });
    if (sub.vendorId.toString() !== vendor._id.toString())
      return res.status(403).json({ success: false, message: "Not your order" });

    const result = await createShipment({ subOrder: sub, shippingAddress: order.shippingAddress, vendor });
    if (result.order_id) {
      sub.shipping.shiprocketOrderId = result.order_id.toString();
      sub.shipping.shipmentId = result.shipment_id?.toString();
      await order.save();
    }

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const assignSubOrderAWB = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    const { orderId, subOrderId } = req.params;
    const { courierId } = req.body;
    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const sub = order.subOrders.find((s) => s.subOrderId === subOrderId);
    if (!sub || sub.vendorId.toString() !== vendor._id.toString())
      return res.status(403).json({ success: false, message: "Not your order" });
    if (!sub.shipping.shipmentId) return res.status(400).json({ success: false, message: "Create shipment first" });

    const result = await assignAWB(sub.shipping.shipmentId, courierId);
    if (result.response?.data?.awb_code) {
      sub.shipping.awbCode = result.response.data.awb_code;
      sub.shipping.courier = result.response.data.courier_name;
      sub.shipping.trackingUrl = `https://shiprocket.co/tracking/${result.response.data.awb_code}`;
      sub.status = "shipped";
      sub.statusHistory.push({ status: "shipped", note: `AWB: ${sub.shipping.awbCode}` });
      await order.save();
    }

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const scheduleSubOrderPickup = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    const { orderId, subOrderId } = req.params;
    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const sub = order.subOrders.find((s) => s.subOrderId === subOrderId);
    if (!sub || sub.vendorId.toString() !== vendor._id.toString())
      return res.status(403).json({ success: false, message: "Not your order" });
    if (!sub.shipping.shipmentId) return res.status(400).json({ success: false, message: "Create shipment first" });

    const result = await schedulePickup(sub.shipping.shipmentId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
