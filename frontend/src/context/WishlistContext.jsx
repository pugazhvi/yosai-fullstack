import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user) { setItems([]); return; }
    try {
      const res = await api.get("/user/wishlist");
      setItems(res.data || []);
    } catch {
      setItems([]);
    }
  }, [user]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const isWishlisted = useCallback(
    (productId) => items.some((p) => (p._id || p) === productId),
    [items]
  );

  const toggleWishlist = async (product) => {
    if (!user) {
      toast.error("Please sign in to save items");
      return false;
    }
    const id = product._id || product;
    setLoading(true);
    try {
      if (isWishlisted(id)) {
        await api.delete(`/user/wishlist/${id}`);
        setItems((prev) => prev.filter((p) => (p._id || p) !== id));
        toast.success("Removed from wishlist");
      } else {
        await api.post(`/user/wishlist/${id}`);
        setItems((prev) => [...prev, product]);
        toast.success("Added to wishlist");
      }
      return true;
    } catch (err) {
      toast.error(err?.message || "Failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <WishlistContext.Provider value={{ items, count: items.length, isWishlisted, toggleWishlist, loading, fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
};
