import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { ArrowLeft, Package, CheckCircle, Loader, XCircle, Clock, Truck, MapPin } from "lucide-react";

const StatusBadge = ({ status }) => {
  let color = "text-gray-700", bgColor = "bg-gray-100";
  if (status === "Delivered" || status === "delivered") { color = "text-green-700"; bgColor = "bg-green-100"; }
  else if (status === "Processing" || status === "processing") { color = "text-amber-700"; bgColor = "bg-amber-100"; }
  else if (status === "Cancelled" || status === "cancelled") { color = "text-red-700"; bgColor = "bg-red-100"; }
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${color} ${bgColor}`}>{status}</span>;
};

export default function OrderDetail() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/my/${orderId}`);
        setOrder(res.data || res.order || res);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader className="h-8 w-8 animate-spin text-pink-600" /></div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Order not found</p></div>;

  const steps = [
    { label: "Order Placed", icon: Package, done: true },
    { label: "Processing", icon: Loader, done: ["Processing", "Shipped", "Delivered"].includes(order.status) },
    { label: "Shipped", icon: Truck, done: ["Shipped", "Delivered"].includes(order.status) },
    { label: "Delivered", icon: CheckCircle, done: order.status === "Delivered" },
  ];

  return (
    <div className="min-h-screen bg-[#fffdfe]">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Link to="/orders" className="flex items-center text-pink-600 hover:text-pink-700 mb-6 font-medium">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
        </Link>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Order Details</h1>
              <p className="text-sm text-gray-500 mt-1">ID: #{order._id?.slice(-8)}</p>
              <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
            <StatusBadge status={order.status || "Pending"} />
          </div>
          {/* Order Steps */}
          <div className="flex items-center justify-between mb-8 overflow-x-auto py-2">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${step.done ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <span className={`text-xs text-center ${step.done ? "text-pink-600 font-medium" : "text-gray-400"}`}>{step.label}</span>
                {index < steps.length - 1 && <div className={`absolute h-0.5 w-16 mt-5 ml-16 ${step.done ? "bg-pink-600" : "bg-gray-200"}`}></div>}
              </div>
            ))}
          </div>
        </div>
        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Items Ordered</h2>
          <div className="space-y-4">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <img src={item.productId?.images?.[0] || "/placeholder.svg"} alt={item.productId?.name} className="w-16 h-16 object-cover rounded-lg" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.productId?.name}</h3>
                  {item.selectedSize && <p className="text-sm text-gray-500">Size: {item.selectedSize}</p>}
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold">Rs.{((item.productId?.price || 0) * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal</span><span>Rs.{order.totalAmount?.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">Shipping</span><span className="text-green-600">Free</span></div>
            <div className="flex justify-between font-bold text-lg"><span>Total</span><span>Rs.{order.totalAmount?.toLocaleString()}</span></div>
          </div>
        </div>
        {/* Shipping Address */}
        {order.shippingAddress && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><MapPin className="h-5 w-5 text-pink-600" /> Shipping Address</h2>
            <p className="text-gray-700">{order.shippingAddress.name}</p>
            <p className="text-gray-600 text-sm">{order.shippingAddress.address}</p>
            <p className="text-gray-600 text-sm">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
            <p className="text-gray-600 text-sm">{order.shippingAddress.phone}</p>
          </div>
        )}
      </div>
    </div>
  );
}
