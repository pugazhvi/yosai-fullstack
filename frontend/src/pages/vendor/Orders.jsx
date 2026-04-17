import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatPrice, formatDate, statusColor } from "@/lib/utils";
import toast from "react-hot-toast";
import { ShoppingBag, Clock, Truck, CheckCircle, Package, Navigation } from "lucide-react";

const STATUS_FLOW = ["pending", "confirmed", "packed", "shipped", "delivered"];

export default function VendorOrders() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState(null);
  const [shippingAction, setShippingAction] = useState(null); // { subOrderId, orderId, action }

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-orders", filter],
    queryFn: async () => {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const res = await api.get(`/orders/vendor${params}`);
      return res.data;
    },
  });

  // Flatten all orders into sub-orders with parent orderId attached
  const orders = (data || []).flatMap((order) =>
    (order.subOrders || []).map((sub) => ({ ...sub, orderId: order.orderId, shippingAddress: order.shippingAddress }))
  );

  const updateMut = useMutation({
    mutationFn: ({ subOrderId, status }) =>
      api.patch(`/orders/vendor/status`, { subOrderId, status }),
    onSuccess: () => {
      qc.invalidateQueries(["vendor-orders"]);
      toast.success("Order status updated");
      setUpdating(null);
    },
    onError: () => toast.error("Failed to update status"),
  });

  const createShipmentMut = useMutation({
    mutationFn: ({ orderId, subOrderId }) =>
      api.post(`/orders/${orderId}/suborders/${subOrderId}/shipment`),
    onSuccess: () => {
      qc.invalidateQueries(["vendor-orders"]);
      toast.success("Shipment created on Shiprocket");
      setShippingAction(null);
    },
    onError: (err) => toast.error(err?.message || "Failed to create shipment"),
  });

  const assignAWBMut = useMutation({
    mutationFn: ({ orderId, subOrderId, courierId }) =>
      api.post(`/orders/${orderId}/suborders/${subOrderId}/awb`, { courierId }),
    onSuccess: () => {
      qc.invalidateQueries(["vendor-orders"]);
      toast.success("AWB assigned");
      setShippingAction(null);
    },
    onError: (err) => toast.error(err?.message || "Failed to assign AWB"),
  });

  const pickupMut = useMutation({
    mutationFn: ({ orderId, subOrderId }) =>
      api.post(`/orders/${orderId}/suborders/${subOrderId}/pickup`),
    onSuccess: () => {
      qc.invalidateQueries(["vendor-orders"]);
      toast.success("Pickup scheduled");
      setShippingAction(null);
    },
    onError: (err) => toast.error(err?.message || "Failed to schedule pickup"),
  });

  const filters = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "confirmed", label: "Confirmed" },
    { key: "packed", label: "Packed" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
  ];

  const getNextStatus = (current) => {
    const i = STATUS_FLOW.indexOf(current);
    return i >= 0 && i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1] : null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your customer orders</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === f.key ? "brand-gradient text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 card">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const nextStatus = getNextStatus(order.status);
            const hasShipment = !!order.shipping?.shiprocketOrderId;
            const hasAWB = !!order.shipping?.awbCode;
            return (
              <div key={order.subOrderId} className={`card p-5 ${order.isDelayed ? "border-l-4 border-l-red-500" : ""}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{order.subOrderId}</p>
                      {order.isDelayed && (
                        <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                          <Clock className="w-3 h-3" /> Delayed
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatPrice(order.subtotal)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColor(order.status)}`}>{order.status}</span>
                  </div>
                </div>

                {/* Earnings breakdown */}
                {(order.commission || order.vendorEarning) && (
                  <div className="flex items-center gap-3 text-xs mb-3 px-3 py-2 rounded-lg bg-green-50 border border-green-100">
                    <span className="text-gray-500">Subtotal: <span className="font-semibold text-gray-800">{formatPrice(order.subtotal)}</span></span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500">Commission: <span className="font-semibold text-red-600">-{formatPrice(order.commission?.amount || 0)} ({order.commission?.rate || 0}%)</span></span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500">Your Earning: <span className="font-bold text-green-700">{formatPrice(order.vendorEarning || 0)}</span></span>
                  </div>
                )}

                {/* Items */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex-shrink-0 flex items-center gap-2 bg-gray-50 rounded-xl p-2">
                      <img src={item.image || "/placeholder.jpg"} alt={item.name} className="w-8 h-8 rounded-lg object-cover" />
                      <div>
                        <p className="text-xs font-medium text-gray-800 max-w-[100px] truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">Qty {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipping info */}
                {hasAWB && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg mb-3">
                    <Truck className="w-3.5 h-3.5" /> AWB: {order.shipping.awbCode}
                    {order.shipping.courier && <span className="text-gray-500">• {order.shipping.courier}</span>}
                    {order.shipping.trackingUrl && (
                      <a href={order.shipping.trackingUrl} target="_blank" rel="noopener noreferrer" className="ml-auto underline">Track</a>
                    )}
                  </div>
                )}

                {/* Shiprocket Actions */}
                {(order.status === "confirmed" || order.status === "packed") && (
                  <div className="flex gap-2 flex-wrap mb-3">
                    {!hasShipment && (
                      <button
                        onClick={() => createShipmentMut.mutate({ orderId: order.orderId, subOrderId: order.subOrderId })}
                        disabled={createShipmentMut.isPending}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors">
                        <Package className="w-3.5 h-3.5" /> Create Shipment
                      </button>
                    )}
                    {hasShipment && !hasAWB && (
                      <button
                        onClick={() => assignAWBMut.mutate({ orderId: order.orderId, subOrderId: order.subOrderId, courierId: null })}
                        disabled={assignAWBMut.isPending}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                        <Truck className="w-3.5 h-3.5" /> Assign AWB
                      </button>
                    )}
                    {hasShipment && (
                      <button
                        onClick={() => pickupMut.mutate({ orderId: order.orderId, subOrderId: order.subOrderId })}
                        disabled={pickupMut.isPending}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors">
                        <Navigation className="w-3.5 h-3.5" /> Schedule Pickup
                      </button>
                    )}
                  </div>
                )}

                {/* Status Action */}
                {nextStatus && order.status !== "delivered" && (
                  <div className="flex gap-2">
                    {updating === order.subOrderId ? (
                      <>
                        <button
                          onClick={() => updateMut.mutate({ subOrderId: order.subOrderId, status: nextStatus })}
                          disabled={updateMut.isPending}
                          className="btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          {updateMut.isPending ? "Updating..." : `Mark as ${nextStatus}`}
                        </button>
                        <button onClick={() => setUpdating(null)} className="btn-outline text-sm py-2 px-4">Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => setUpdating(order.subOrderId)} className="btn-primary text-sm py-2 px-4 capitalize">
                        Mark as {nextStatus}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
