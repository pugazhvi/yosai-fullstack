import mongoose from "mongoose";

const CommissionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    slabs: [
      {
        minAmount: { type: Number, required: true },
        maxAmount: { type: Number, default: null }, // null = unlimited
        rate: { type: Number, required: true }, // 0.05 = 5%
      },
    ],
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    appliedTo: { type: String, enum: ["global", "vendor", "category"], default: "global" },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", default: null },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
  },
  { timestamps: true }
);

const Commission = mongoose.models.Commission || mongoose.model("Commission", CommissionSchema);
export default Commission;
