import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatPrice, formatDate, statusColor } from "@/lib/utils";
import { ShoppingBag, Search, Clock } from "lucide-react";

export default function AdminOrders() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", filter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filter !== "all") params.set("status", filter);
      const res = await api.get(`/admin/orders?${params}`);
      return res.data;
    },
  });

  const orders = (data || []).filter(o =>
    !search || o.orderId?.toLowerCase().includes(search.toLowerCase()) ||
    o.customerId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const filters = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "confirmed", label: "Confirmed" },
    { key: "processing", label: "Processing" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 text-sm mt-1">All platform orders</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search by order ID or customer..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${filter === f.key ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-gray-500">
                    <th className="text-left px-4 py-3 font-medium">Order ID</th>
                    <th className="text-left px-4 py-3 font-medium">Customer</th>
                    <th className="text-left px-4 py-3 font-medium">Amount</th>
                    <th className="text-left px-4 py-3 font-medium">Sub-orders</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Delayed</th>
                    <th className="text-left px-4 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">
                        <ShoppingBag className="w-8 h-8 mx-auto mb-2" />
                        No orders found
                      </td>
                    </tr>
                  ) : orders.map(order => {
                    const hasDelayed = order.subOrders?.some(s => s.isDelayed);
                    const overallStatus = order.subOrders?.length === 1
                      ? order.subOrders[0].status
                      : order.subOrders?.every(s => s.status === "delivered") ? "delivered"
                      : order.subOrders?.some(s => s.status === "shipped") ? "shipped"
                      : order.subOrders?.[0]?.status || "pending";

                    return (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-purple-600">{order.orderId}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-800">{order.customerId?.name || "-"}</p>
                            <p className="text-xs text-gray-400">{order.customerId?.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold">{formatPrice(order.payment?.amount || 0)}</td>
                        <td className="px-4 py-3 text-gray-600">{order.subOrders?.length} vendor(s)</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColor(overallStatus)}`}>{overallStatus}</span>
                        </td>
                        <td className="px-4 py-3">
                          {hasDelayed && (
                            <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                              <Clock className="w-3 h-3" /> Yes
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(order.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {data?.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline px-3 py-1.5 text-sm disabled:opacity-50">Prev</button>
              <span className="px-3 py-1.5 text-sm text-gray-600">Page {page} of {data.totalPages}</span>
              <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="btn-outline px-3 py-1.5 text-sm disabled:opacity-50">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
