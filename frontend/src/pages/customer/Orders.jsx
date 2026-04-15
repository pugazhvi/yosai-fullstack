import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Package, ChevronRight, Calendar, ShoppingBag, CheckCircle, Loader, XCircle, Clock, AlertCircle } from "lucide-react";

const StatusBadge = ({ status }) => {
  let color = "text-gray-700", bgColor = "bg-gray-100", icon = <Package className="h-4 w-4 mr-1" />;
  if (status === "Delivered") { color = "text-green-700"; bgColor = "bg-green-100"; icon = <CheckCircle className="h-4 w-4 mr-1" />; }
  else if (status === "Processing" || status === "pending") { color = "text-amber-700"; bgColor = "bg-amber-100"; icon = <Loader className="h-4 w-4 mr-1 animate-spin" />; }
  else if (status === "Cancelled" || status === "cancelled") { color = "text-red-700"; bgColor = "bg-red-100"; icon = <XCircle className="h-4 w-4 mr-1" />; }
  else if (status === "Pending") { color = "text-blue-700"; bgColor = "bg-blue-100"; icon = <Clock className="h-4 w-4 mr-1" />; }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color} ${bgColor}`}>{icon}{status}</span>;
};

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) { navigate("/auth?redirect=/orders"); return; }
    const fetchOrders = async () => {
      try {
        const res = await api.get("/orders/my");
        const data = Array.isArray(res) ? res : res.data || res.orders || [];
        setOrders(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchOrders();
  }, [user]);

  const filteredOrders = orders.filter((order) => {
    const matchesFilter = filter === "all" || order.status?.toLowerCase() === filter;
    const matchesSearch = !searchQuery || order.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) || order.status?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center"><Loader className="h-8 w-8 animate-spin text-pink-600 mx-auto mb-4" /><p className="text-gray-500">Loading your orders...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fffdfe]">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">My Orders</h1>
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["all", "pending", "processing", "delivered", "cancelled"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === f ? "bg-pink-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-pink-300"}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6"><ShoppingBag className="h-12 w-12 text-gray-400" /></div>
            <h2 className="text-2xl font-semibold mb-2">No orders found</h2>
            <p className="text-gray-500 mb-6">You haven't placed any orders yet.</p>
            <Link to="/readymades" className="px-6 py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Order ID</p>
                    <p className="font-medium text-gray-900 text-sm">{order.orderId}</p>
                  </div>
                  <StatusBadge status={order.status || "Pending"} />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                {order.items && order.items.length > 0 && (
                  <div className="flex -space-x-2 mb-4">
                    {order.items.slice(0, 3).map((item, i) => (
                      <img key={i} src={item.productId?.images?.[0] || "/placeholder.svg"} alt="" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                    ))}
                    {order.items.length > 3 && <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs text-gray-600">+{order.items.length - 3}</div>}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-500">{order.items?.length || 0} item(s)</span>
                    <p className="font-semibold text-gray-900">Rs.{order.totalAmount?.toLocaleString()}</p>
                  </div>
                  <Link to={`/orders/${order.orderId}`} className="flex items-center text-pink-600 hover:text-pink-700 font-medium text-sm">
                    View Details <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
