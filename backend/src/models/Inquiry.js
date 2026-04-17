import mongoose from "mongoose";

const InquirySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["contact", "callback", "booking"], required: true },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    message: { type: String },
    // Booking specific
    serviceType: { type: String },
    measurements: { type: String },
    fabricDescription: { type: String },
    preferredDate: { type: String },
    notes: { type: String },
    // Callback specific
    preferredTime: { type: String },
    // Management
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, enum: ["new", "seen", "replied", "resolved", "archived"], default: "new" },
    adminNote: { type: String },
    repliedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Inquiry", InquirySchema);
