import Commission from "../models/Commission.js";
import Vendor from "../models/Vendor.js";

/**
 * Commission priority:
 * 1. Vendor-specific override (highest priority)
 * 2. Category-specific commission
 * 3. Global default
 * 4. Hardcoded 5% fallback
 */
export const calculateCommission = async (orderAmount, vendorId, categoryId = null) => {
  // 1. Check vendor-specific override
  const vendor = await Vendor.findById(vendorId).populate("commissionOverride");
  let config = vendor?.commissionOverride?.isActive ? vendor.commissionOverride : null;

  // 2. Check category-specific commission
  if (!config && categoryId) {
    config = await Commission.findOne({ appliedTo: "category", categoryId, isActive: true });
  }

  // 3. Global default
  if (!config) {
    config = await Commission.findOne({ isDefault: true, isActive: true });
  }

  // 4. Fallback
  if (!config) return { rate: 0.05, amount: Math.round(orderAmount * 0.05) };

  const slab = config.slabs.find(
    (s) => orderAmount >= s.minAmount && (s.maxAmount === null || orderAmount < s.maxAmount)
  );

  const rate = slab?.rate ?? 0.05;
  return { rate, amount: Math.round(orderAmount * rate) };
};
