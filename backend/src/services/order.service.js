import Order from "../models/Order.js";
import { calculateCommission } from "./commission.service.js";
import { creditWallet } from "./wallet.service.js";
import { createNotification } from "./notification.service.js";
import Vendor from "../models/Vendor.js";

export const splitAndCreateOrder = async (customerId, cartItems, paymentData, shippingAddress) => {
  // 1. Group items by vendor
  const vendorGroups = cartItems.reduce((acc, item) => {
    const vid = item.vendorId.toString();
    if (!acc[vid]) acc[vid] = [];
    acc[vid].push(item);
    return acc;
  }, {});

  const orderId = `YOS-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const totalAmount = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalMRP = cartItems.reduce((s, i) => s + i.mrp * i.quantity, 0);

  // 2. Build sub-orders
  const subOrders = [];
  let suffix = 65; // 'A'

  for (const [vendorId, items] of Object.entries(vendorGroups)) {
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const commission = await calculateCommission(subtotal, vendorId);

    subOrders.push({
      vendorId,
      subOrderId: `${orderId}-${String.fromCharCode(suffix++)}`,
      items: items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        name: i.name,
        image: i.image,
        price: i.price,
        mrp: i.mrp,
        quantity: i.quantity,
        selectedSize: i.selectedSize,
        selectedColor: i.selectedColor,
      })),
      subtotal,
      commission,
      vendorEarning: subtotal - commission.amount,
      statusHistory: [{ status: "pending", note: "Order placed" }],
    });
  }

  const isCOD = paymentData?.method === "cod";
  const order = await Order.create({
    customerId,
    orderId,
    payment: {
      ...paymentData,
      status: paymentData?.status || (isCOD ? "pending" : "paid"),
      paidAt: isCOD ? null : new Date(),
    },
    shippingAddress,
    subOrders,
    totalAmount,
    totalMRP,
    status: isCOD ? "pending" : "confirmed",
  });

  // 3. Notify vendors
  for (const sub of order.subOrders) {
    const vendor = await Vendor.findById(sub.vendorId);
    if (vendor) {
      await createNotification({
        userId: vendor.userId,
        title: "New Order Received",
        message: `Order ${sub.subOrderId} has been placed. Please process it within 48 hours.`,
        type: "order_placed",
        referenceId: order.orderId,
      });
      // Update vendor stats
      await Vendor.findByIdAndUpdate(sub.vendorId, {
        $inc: { totalOrders: 1, totalRevenue: sub.vendorEarning },
      });
    }
  }

  return order;
};

// Check orders delayed > 48 hours — call via cron
export const checkDelayedOrders = async () => {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const delayed = await Order.find({
    "subOrders.status": "pending",
    "subOrders.delayAlertSent": false,
    createdAt: { $lt: cutoff },
  });

  for (const order of delayed) {
    for (const sub of order.subOrders) {
      if (sub.status === "pending" && !sub.delayAlertSent) {
        sub.isDelayed = true;
        sub.delayAlertSent = true;
        const vendor = await Vendor.findById(sub.vendorId);
        if (vendor) {
          await createNotification({
            userId: vendor.userId,
            title: "Order Delay Alert",
            message: `Order ${sub.subOrderId} has not been processed in 48 hours.`,
            type: "order_delayed",
            referenceId: order.orderId,
          });
        }
      }
    }
    await order.save();
  }
};
