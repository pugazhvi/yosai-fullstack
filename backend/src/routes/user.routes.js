import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { updateProfile, getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, getWishlist, addToWishlist, removeFromWishlist } from "../controllers/user.controller.js";

const router = Router();
router.use(protect);

router.put("/profile", updateProfile);
router.get("/addresses", getAddresses);
router.post("/addresses", addAddress);
router.put("/addresses/:addressId", updateAddress);
router.delete("/addresses/:addressId", deleteAddress);
router.patch("/addresses/:addressId/default", setDefaultAddress);

router.get("/wishlist", getWishlist);
router.post("/wishlist/:productId", addToWishlist);
router.delete("/wishlist/:productId", removeFromWishlist);

export default router;
