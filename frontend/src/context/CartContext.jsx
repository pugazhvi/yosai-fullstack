import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { v4 as uuidv4 } from "uuid";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);

  const getCartId = () => {
    let id = localStorage.getItem("yosai_cart_id");
    if (!id) { id = uuidv4(); localStorage.setItem("yosai_cart_id", id); }
    return id;
  };

  useEffect(() => { fetchCart(); }, []);

  const fetchCart = async () => {
    try {
      const cartId = getCartId();
      const res = await api.get(`/cart?cartId=${cartId}`);
      setCart(res.data || { items: [] });
    } catch { setCart({ items: [] }); }
  };

  const addToCart = async (productId, selectedSize, quantity = 1) => {
    setLoading(true);
    try {
      const res = await api.post("/cart/add", { cartId: getCartId(), productId, quantity, selectedSize });
      if (res.cartId) localStorage.setItem("yosai_cart_id", res.cartId);
      setCart(res.data);
      return true;
    } finally { setLoading(false); }
  };

  const updateQuantity = async (itemId, quantity) => {
    const res = await api.put("/cart/update", { cartId: getCartId(), itemId, quantity });
    setCart(res.data);
  };

  const removeItem = async (itemId) => {
    const res = await api.delete("/cart/remove", { data: { cartId: getCartId(), itemId } });
    setCart(res.data);
  };

  const clearCart = async () => {
    await api.delete("/cart/clear", { data: { cartId: getCartId() } });
    setCart({ items: [] });
  };

  const isInCart = useCallback((productId) => {
    return cart.items?.some((item) => item.productId === productId || item.productId?._id === productId);
  }, [cart]);

  const isSizeInCart = useCallback((productId, size) => {
    return cart.items?.some((item) =>
      size
        ? (item.productId === productId || item.productId?._id === productId) && item.selectedSize === size
        : (item.productId === productId || item.productId?._id === productId)
    );
  }, [cart]);

  const getQuantity = useCallback((productId, size) => {
    return cart.items?.reduce((total, item) => {
      const id = item.productId?._id || item.productId;
      if (id === productId && (!size || item.selectedSize === size)) {
        return total + (item.quantity || 0);
      }
      return total;
    }, 0) || 0;
  }, [cart]);

  const itemCount = cart.items?.length || 0;
  const total = cart.items?.reduce((s, i) => s + (i.price || i.productId?.variants?.[0]?.price || 0) * i.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, updateQuantity, removeItem, clearCart, fetchCart, itemCount, total, isInCart, isSizeInCart, getQuantity }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
