import { Router } from "express";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Get reviews for a product
router.get("/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId })
      .populate("userId", "name avatar")
      .sort("-createdAt");
    const total = reviews.length;
    const avg = total > 0 ? +(reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : 0;
    const breakdown = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length,
    }));
    res.json({ success: true, data: { reviews, total, avg, breakdown } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Submit a review (must be logged in)
router.post("/:productId", protect, async (req, res) => {
  try {
    const { rating, title, comment, images, orderId } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be 1-5" });
    }

    // Check if already reviewed
    const existing = await Review.findOne({ productId: req.params.productId, userId: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: "You already reviewed this product" });
    }

    // Check if verified purchase
    let isVerifiedPurchase = false;
    if (orderId) {
      const order = await Order.findOne({
        orderId,
        customerId: req.user._id,
        "subOrders.items.productId": req.params.productId,
        "subOrders.status": "delivered",
      });
      if (order) isVerifiedPurchase = true;
    } else {
      const order = await Order.findOne({
        customerId: req.user._id,
        "subOrders.items.productId": req.params.productId,
        "subOrders.status": "delivered",
      });
      if (order) isVerifiedPurchase = true;
    }

    const review = await Review.create({
      productId: req.params.productId,
      userId: req.user._id,
      orderId,
      rating,
      title,
      comment,
      images: images || [],
      isVerifiedPurchase,
    });

    // Update product rating
    const allReviews = await Review.find({ productId: req.params.productId });
    const avg = +(allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1);
    await Product.findByIdAndUpdate(req.params.productId, { rating: avg, reviewCount: allReviews.length });

    const populated = await review.populate("userId", "name avatar");
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: "You already reviewed this product" });
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete own review
router.delete("/:reviewId", protect, async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({ _id: req.params.reviewId, userId: req.user._id });
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    // Recalc product rating
    const allReviews = await Review.find({ productId: review.productId });
    const avg = allReviews.length > 0 ? +(allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1) : 0;
    await Product.findByIdAndUpdate(review.productId, { rating: avg, reviewCount: allReviews.length });

    res.json({ success: true, message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
