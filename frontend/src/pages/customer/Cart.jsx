import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Trash2, ShoppingBag, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const CartItem = ({ item, onIncrease, onDecrease, onRemove, loading }) => {
  const name = item.name || item.productId?.name || "Product";
  const image = item.image || item.productId?.images?.[0] || "/placeholder.svg";
  const price = item.price || item.productId?.variants?.[0]?.price || 0;
  const mrp = item.mrp || item.productId?.variants?.[0]?.mrp || 0;
  const discount = mrp && price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <img src={image} alt={name} className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-md shadow-sm" loading="lazy" />
            {discount > 0 && <Badge className="absolute -top-2 -left-2 bg-green-600">{discount}% OFF</Badge>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between">
              <div>
                <h3 className="font-medium text-base md:text-lg text-gray-900 line-clamp-2">{name}</h3>
                {item.selectedColor && <p className="text-sm text-gray-500 mt-1">Color: {item.selectedColor}</p>}
                {item.selectedSize && <Badge variant="outline" className="mt-1">Size: {item.selectedSize}</Badge>}
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-gray-900">Rs.{price.toLocaleString()}</span>
                {mrp > price && <div className="text-sm text-gray-500 line-through">Rs.{mrp.toLocaleString()}</div>}
              </div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center border rounded-md">
                <Button size="icon" variant="ghost" disabled={loading} onClick={() => onDecrease(item)} className="h-8 w-8 rounded-none rounded-l-md">
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Minus className="h-3 w-3" />}
                </Button>
                <span className="px-3 py-1 text-center min-w-[40px]">{item.quantity}</span>
                <Button size="icon" variant="ghost" disabled={loading} onClick={() => onIncrease(item)} className="h-8 w-8 rounded-none rounded-r-md">
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onRemove(item)} className="text-red-600 hover:text-red-800 hover:bg-red-50">
                <Trash2 className="h-4 w-4 mr-1" /> Remove
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Cart() {
  const { cart, updateQuantity, removeItem, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingItems, setLoadingItems] = useState({});
  const items = cart.items || [];
  const subtotal = items.reduce((s, item) => s + (item.price || item.productId?.variants?.[0]?.price || 0) * item.quantity, 0);
  const shipping = subtotal > 0 ? 100 : 0;
  const total = subtotal + shipping;

  const setLoad = (id, val) => setLoadingItems((prev) => ({ ...prev, [id]: val }));

  const handleIncrease = async (item) => {
    const id = item._id;
    setLoad(id, true);
    try { await updateQuantity(id, item.quantity + 1); await fetchCart(); } finally { setLoad(id, false); }
  };
  const handleDecrease = async (item) => {
    const id = item._id;
    setLoad(id, true);
    try {
      if (item.quantity <= 1) { await removeItem(id); } else { await updateQuantity(id, item.quantity - 1); }
      await fetchCart();
    } finally { setLoad(id, false); }
  };
  const handleRemove = async (item) => {
    const id = item._id;
    setLoad(id, true);
    try { await removeItem(id); await fetchCart(); } finally { setLoad(id, false); }
  };
  const handleCheckout = () => {
    if (!user) { navigate("/auth?redirect=/checkout"); return; }
    navigate("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center min-h-[60vh]">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="h-12 w-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6 max-w-md">Browse our products and find something you love!</p>
        <Link to="/readymades"><Button size="lg" className="gap-2 bg-pink-600 hover:bg-pink-500"><ShoppingBag className="h-4 w-4" /> Continue Shopping</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffdfe]">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">Your Cart</h1>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            {items.map((item) => {
              const id = item.productId?._id || item.productId;
              return <CartItem key={item._id || id} item={item} onIncrease={handleIncrease} onDecrease={handleDecrease} onRemove={handleRemove} loading={!!loadingItems[id]} />;
            })}
          </div>
          <div className="lg:w-80">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal ({items.length} items)</span><span className="font-medium">Rs.{subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Shipping</span><span className="font-medium text-green-600">{shipping === 0 ? "Free" : "Rs." + shipping}</span></div>
                  <div className="border-t pt-3 flex justify-between"><span className="font-semibold text-gray-900">Total</span><span className="font-bold text-lg">Rs.{total.toLocaleString()}</span></div>
                </div>
                <Button onClick={handleCheckout} className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-lg font-semibold">Proceed to Checkout</Button>
                <Link to="/readymades" className="block text-center mt-4 text-sm text-pink-600 hover:text-pink-700">Continue Shopping</Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
