import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/utils";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Shield, Truck, Wallet, CreditCard, Banknote, Check, Package, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const { cart, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [useWallet, setUseWallet] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (!successData) return;

    const fireConfetti = () => {
      const colors = ["#ec4899", "#a855f7", "#f59e0b", "#10b981", "#3b82f6"];

      // Big center burst
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.45 },
        colors,
        startVelocity: 45,
      });

      // Side cannons
      setTimeout(() => {
        confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors });
        confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors });
      }, 250);

      // Lingering drizzle from top
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 120,
          origin: { y: 0 },
          colors,
          gravity: 0.6,
          ticks: 300,
        });
      }, 600);
    };

    fireConfetti();
  }, [successData]);
  const [address, setAddress] = useState({ name: "", phone: "", street: "", locality: "", city: "", state: "", pincode: "", country: "India" });

  const { data: walletData } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const res = await api.get("/wallet");
      return res.data;
    },
    enabled: !!user,
  });

  const walletBalance = walletData?.balance || 0;
  const walletDeduction = useWallet ? Math.min(walletBalance, total) : 0;
  const payableAmount = Math.max(0, total - walletDeduction);

  const handleOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cartId = localStorage.getItem("yosai_cart_id");

      // Full wallet payment OR Cash on Delivery — no payment gateway needed
      if (payableAmount === 0 || paymentMethod === "cod") {
        const order = await api.post("/orders/place", {
          razorpayOrderId: null,
          razorpayPaymentId: null,
          razorpaySignature: null,
          cartId,
          shippingAddress: address,
          walletAmount: walletDeduction,
          paymentMethod: payableAmount === 0 ? "online" : paymentMethod,
        });
        await clearCart();
        setSuccessData({
          orderId: order.data.orderId,
          amount: payableAmount,
          method: paymentMethod === "cod" && payableAmount > 0 ? "cod" : "online",
        });
        return;
      }

      // Load Razorpay SDK
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error("Failed to load payment gateway. Please try again.");
        return;
      }

      // Create Razorpay order
      const rzpRes = await api.post("/orders/razorpay", { amount: payableAmount });

      await new Promise((resolve, reject) => {
        const options = {
          key: rzpRes.key,
          amount: rzpRes.amount,
          currency: rzpRes.currency || "INR",
          name: "Yosai",
          description: "Order Payment",
          image: "/logo.png",
          order_id: rzpRes.orderId,
          prefill: {
            name: user?.name || address.name,
            email: user?.email || "",
            contact: user?.phone || address.phone,
          },
          theme: { color: "#DB2777" },
          handler: async (response) => {
            try {
              const order = await api.post("/orders/place", {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                cartId,
                shippingAddress: address,
                walletAmount: walletDeduction,
              });
              await clearCart();
              setSuccessData({ orderId: order.data.orderId, amount: payableAmount, method: "online" });
              resolve();
            } catch (err) {
              toast.error(err.message || "Order placement failed");
              reject(err);
            }
          },
          modal: {
            ondismiss: () => {
              toast("Payment cancelled");
              reject(new Error("dismissed"));
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (resp) => {
          toast.error("Payment failed: " + resp.error.description);
          reject(new Error(resp.error.description));
        });
        rzp.open();
      });
    } catch (err) {
      if (err?.message !== "dismissed") {
        toast.error(err?.message || "Failed to place order");
      }
    } finally {
      setLoading(false);
    }
  };

  const items = cart?.items || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-32 lg:pb-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Checkout</h1>
      <form onSubmit={handleOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Address */}
            <div className="card p-4 sm:p-6">
              <h2 className="font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base"><Truck className="w-4 h-4 text-pink-600" /> Delivery Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {[["name", "Full Name"], ["phone", "Phone Number"], ["street", "Street Address"], ["locality", "Locality / Area"], ["city", "City"], ["state", "State"], ["pincode", "Pincode"]].map(([field, label]) => (
                  <div key={field} className={field === "street" || field === "locality" ? "sm:col-span-2" : ""}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input className="input" value={address[field]} onChange={(e) => setAddress({ ...address, [field]: e.target.value })} required />
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="card p-4 sm:p-6">
              <h2 className="font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <CreditCard className="w-4 h-4 text-pink-600" /> Payment Method
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "cod" ? "border-pink-500 bg-pink-50/50" : "border-gray-200 hover:border-gray-300"}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-0.5 w-4 h-4 accent-pink-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-green-600" />
                      <p className="text-sm font-semibold text-gray-900">Cash on Delivery</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Pay when your order arrives</p>
                  </div>
                </label>

                <label className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "online" ? "border-pink-500 bg-pink-50/50" : "border-gray-200 hover:border-gray-300"}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === "online"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-0.5 w-4 h-4 accent-pink-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-semibold text-gray-900">Online Payment</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">UPI, Cards, Net Banking via Razorpay</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Wallet */}
            {walletBalance > 0 && (
              <div className="card p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={useWallet} onChange={(e) => setUseWallet(e.target.checked)} className="w-4 h-4 accent-pink-600" />
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Use Wallet Balance</p>
                      <p className="text-xs text-gray-500">Available: {formatPrice(walletBalance)}</p>
                    </div>
                  </div>
                  {useWallet && <span className="ml-auto text-sm font-semibold text-green-600">-{formatPrice(walletDeduction)}</span>}
                </label>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="card p-4 sm:p-6 lg:sticky lg:top-20">
              <h3 className="font-bold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Order Summary</h3>
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {items.map((i) => (
                  <div key={i._id} className="flex gap-2 text-sm">
                    <img src={i.image || "/placeholder.jpg"} alt={i.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 font-medium truncate">{i.name}</p>
                      <p className="text-gray-500 text-xs">Qty {i.quantity} × {formatPrice(i.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatPrice(total)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Shipping</span><span className="text-green-600">FREE</span></div>
                {walletDeduction > 0 && (
                  <div className="flex justify-between text-green-600"><span>Wallet Discount</span><span>-{formatPrice(walletDeduction)}</span></div>
                )}
                <div className="flex justify-between font-bold text-gray-900 text-base border-t pt-2"><span>To Pay</span><span>{formatPrice(payableAmount)}</span></div>
              </div>
              <button type="submit" disabled={loading || items.length === 0} className="btn-primary w-full mt-4 hidden lg:flex items-center justify-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Shield className="w-4 h-4" />}
                {loading
                  ? "Processing..."
                  : payableAmount === 0
                  ? "Place Order"
                  : paymentMethod === "cod"
                  ? `Place COD Order (${formatPrice(payableAmount)})`
                  : `Pay ${formatPrice(payableAmount)}`}
              </button>
              <p className="hidden lg:block text-center text-xs text-gray-400 mt-2">
                {paymentMethod === "cod" ? "Pay with cash when your order arrives" : "Secured by Razorpay"}
              </p>
            </div>
          </div>
        </div>

        {/* Mobile sticky pay bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total</p>
              <p className="text-lg font-bold text-gray-900 leading-none">{formatPrice(payableAmount)}</p>
            </div>
            <button type="submit" disabled={loading || items.length === 0} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Shield className="w-4 h-4" />}
              {loading
                ? "Processing..."
                : payableAmount === 0
                ? "Place Order"
                : paymentMethod === "cod"
                ? "Place COD Order"
                : "Pay Now"}
            </button>
          </div>
        </div>
      </form>

      <AnimatePresence>
        {successData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4 overflow-hidden"
          >
            {/* Confetti-style decorative blurs */}
            <div className="absolute top-10 left-10 w-64 h-64 bg-pink-200/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-100/30 rounded-full blur-3xl pointer-events-none" />

            {/* Floating sparkles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute pointer-events-none"
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0.5],
                  x: [0, (i % 2 ? 1 : -1) * (40 + i * 15)],
                  y: [0, -60 - i * 20],
                }}
                transition={{ duration: 2, delay: 0.3 + i * 0.15, repeat: Infinity, repeatDelay: 1 }}
                style={{
                  left: `${30 + i * 8}%`,
                  top: `${40 + (i % 3) * 10}%`,
                }}
              >
                <Sparkles className={`w-4 h-4 ${i % 2 ? "text-pink-400" : "text-purple-400"}`} />
              </motion.div>
            ))}

            <motion.div
              initial={{ scale: 0.8, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
              className="relative bg-white rounded-3xl shadow-2xl shadow-pink-500/20 max-w-md w-full p-6 sm:p-10 text-center overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Green ring pulse */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.4, 1] }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="absolute inset-0 rounded-full bg-green-100"
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.5 }}
                  className="absolute inset-2 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/40"
                >
                  <motion.div
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                  >
                    <Check className="w-10 h-10 sm:w-12 sm:h-12 text-white" strokeWidth={3} />
                  </motion.div>
                </motion.div>

                {/* Expanding ripples */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 1.2, delay: 0.8, repeat: 2 }}
                  className="absolute inset-0 rounded-full border-2 border-green-400"
                />
              </div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2"
              >
                Order Placed!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="text-gray-500 text-sm sm:text-base mb-1"
              >
                {successData.method === "cod"
                  ? "Your order has been confirmed. Pay cash on delivery."
                  : "Thank you! Your payment was successful."}
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-xs text-gray-400 font-mono mb-6"
              >
                Order ID: {successData.orderId}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-4 mb-6 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <Package className="w-5 h-5 text-pink-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-xs text-gray-500">Total Amount</p>
                  <p className="text-lg font-bold text-gray-900">{formatPrice(successData.amount)}</p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-semibold uppercase tracking-wider ${successData.method === "cod" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                  {successData.method === "cod" ? "COD" : "Paid"}
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <button
                  onClick={() => navigate(`/orders/${successData.orderId}`)}
                  className="btn-primary flex-1"
                >
                  View Order
                </button>
                <button
                  onClick={() => navigate("/readymades")}
                  className="btn-outline flex-1"
                >
                  Continue Shopping
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
