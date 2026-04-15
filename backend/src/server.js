import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cron from "node-cron";
import { connectDB } from "./config/db.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import productRoutes from "./routes/product.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import vendorRoutes from "./routes/vendor.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import commissionRoutes from "./routes/commission.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import messageRoutes from "./routes/message.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import supportRoutes from "./routes/support.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import vendorBankRoutes from "./routes/vendor-bank.routes.js";
import documentRoutes from "./routes/document.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

// Services
import { checkDelayedOrders } from "./services/order.service.js";

connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(morgan("dev"));

// Raw body for webhook signature verification
app.use("/api/webhooks", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/commissions", commissionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/vendor-bank", vendorBankRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/api/health", (_, res) => res.json({ status: "ok", version: "2.0.0" }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || "Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Yosai Backend running on port ${PORT}`);

  // Cron: Check for delayed orders every hour
  cron.schedule("0 * * * *", async () => {
    console.log("[CRON] Checking for delayed orders...");
    try {
      await checkDelayedOrders();
    } catch (err) {
      console.error("[CRON] Error checking delayed orders:", err.message);
    }
  });
});
