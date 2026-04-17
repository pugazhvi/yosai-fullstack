import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatPrice, formatDate, statusColor } from "@/lib/utils";
import { Package, ShoppingBag, TrendingUp, Store, AlertCircle, Banknote, UserCheck } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const res = await api.get("/admin/dashboard");
      return res.data;
    },
  });

  if (isLoading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
      <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
    </div>
  );

  const stats = data || {};
  const recentOrders = stats.recentOrders || [];
  const monthlyRevenue = (stats.monthlyRevenue || []).map(m => ({
    month: m._id,
    revenue: m.revenue,
    orders: m.orders,
  }));

  const statCards = [
    { label: "Total Revenue", value: formatPrice(stats.totalRevenue || 0), icon: TrendingUp, color: "text-pink-600", bg: "bg-pink-50" },
    { label: "Total Orders", value: stats.totalOrders || 0, icon: ShoppingBag, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Total Products", value: stats.totalProducts || 0, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Vendors", value: stats.totalVendors || 0, icon: Store, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Customers", value: stats.totalCustomers || 0, icon: UserCheck, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Commission Earned", value: formatPrice(stats.totalCommission || 0), icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Pending Vendors", value: stats.pendingVendors || 0, icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Pending Payouts", value: stats.pendingPayouts || 0, icon: Banknote, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">Platform overview and insights</p>
      </div>

      {/* Pending Alerts */}
      {(stats.pendingVendors > 0 || stats.pendingPayouts > 0) && (
        <div className="flex flex-wrap gap-3">
          {stats.pendingVendors > 0 && (
            <a href="/admin/vendors" className="flex items-center gap-2 px-4 py-2.5 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 hover:bg-yellow-100 transition-colors">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{stats.pendingVendors} vendor application(s) pending</span>
            </a>
          )}
          {stats.pendingPayouts > 0 && (
            <a href="/admin/payouts" className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-800 hover:bg-red-100 transition-colors">
              <Banknote className="w-4 h-4" />
              <span className="text-sm font-medium">{stats.pendingPayouts} payout request(s) pending</span>
            </a>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-3 sm:p-5">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 ${bg} rounded-xl flex items-center justify-center mb-2 sm:mb-3`}>
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} />
            </div>
            <p className="text-lg sm:text-xl sm:text-2xl font-bold text-gray-900 truncate">{value}</p>
            <p className="text-gray-500 text-[11px] sm:text-sm mt-0.5 truncate">{label}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      {monthlyRevenue.length > 0 && (
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4">Revenue Trend (Last 6 Months)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyRevenue}>
              <defs>
                <linearGradient id="adminRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `\u20B9${v}`} />
              <Tooltip formatter={(v, name) => [name === "revenue" ? formatPrice(v) : v, name === "revenue" ? "Revenue" : "Orders"]} />
              <Area type="monotone" dataKey="revenue" stroke="#7C3AED" fill="url(#adminRevGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Orders */}
      <div className="card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 text-sm sm:text-base">Recent Orders</h2>
          <a href="/admin/orders" className="text-xs sm:text-sm text-purple-600 hover:underline">View all</a>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-gray-400 text-center py-6">No orders yet</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100">
                    <th className="text-left py-2 font-medium">Order</th>
                    <th className="text-left py-2 font-medium">Customer</th>
                    <th className="text-left py-2 font-medium">Amount</th>
                    <th className="text-left py-2 font-medium">Status</th>
                    <th className="text-left py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map(order => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 font-mono text-xs text-purple-600">{order.orderNumber || order.orderId || order._id?.slice(-8)}</td>
                      <td className="py-2.5 text-gray-800">{order.customerId?.name || "-"}</td>
                      <td className="py-2.5 font-semibold">{formatPrice(order.totalAmount || 0)}</td>
                      <td className="py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColor(order.status)}`}>
                          {order.status || "pending"}
                        </span>
                      </td>
                      <td className="py-2.5 text-gray-400">{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="sm:hidden space-y-2.5">
              {recentOrders.map(order => (
                <div key={order._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{order.customerId?.name || "Customer"}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize flex-shrink-0 ${statusColor(order.status)}`}>
                        {order.status || "pending"}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{order.orderNumber || order.orderId || order._id?.slice(-8)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">{formatPrice(order.totalAmount || 0)}</p>
                    <p className="text-[10px] text-gray-400">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
