import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { Package, Search, CheckCircle, XCircle, Eye, X, Truck, RotateCcw, Shield, Star } from "lucide-react";

const statusBadge = (s) => {
  const map = {
    approved: "bg-green-100 text-green-700",
    pending_approval: "bg-yellow-100 text-yellow-700",
    rejected: "bg-red-100 text-red-700",
    draft: "bg-gray-100 text-gray-600",
    archived: "bg-gray-100 text-gray-500",
  };
  return map[s] || "bg-gray-100 text-gray-600";
};

export default function AdminProducts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("pending_approval");
  const [viewProduct, setViewProduct] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", filter],
    queryFn: async () => {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const res = await api.get(`/admin/products${params}`);
      return res.data;
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, status, reason }) => api.patch(`/admin/products/${id}/status`, { status, reason }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries(["admin-products"]);
      toast.success(`Product ${vars.status}`);
    },
    onError: () => toast.error("Failed to update product status"),
  });

  const products = (data || []).filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const filters = [
    { key: "pending_approval", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-500 text-sm mt-1">Review and approve vendor products</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${filter === f.key ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 card">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => {
            const lowestPrice = p.variants?.length ? Math.min(...p.variants.map(v => v.price)) : 0;
            return (
              <div key={p._id} className="card overflow-hidden">
                <div className="relative">
                  <img src={p.images?.[0] || "/placeholder.jpg"} alt={p.name} className="w-full h-40 object-cover" />
                  <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full capitalize ${statusBadge(p.status)}`}>
                    {p.status?.replace("_", " ")}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{p.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{p.vendorId?.brandName} · {p.category?.name || p.category}</p>
                  <p className="font-bold text-gray-900 mt-1">{formatPrice(lowestPrice)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Submitted {formatDate(p.createdAt)}</p>

                  <button onClick={() => setViewProduct(p)} className="w-full mt-2 flex items-center justify-center gap-1 text-xs text-purple-600 hover:bg-purple-50 py-1.5 rounded-lg font-medium transition-colors">
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </button>

                  {p.status === "pending_approval" && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => updateMut.mutate({ id: p._id, status: "approved" })}
                        disabled={updateMut.isPending}
                        className="flex-1 flex items-center justify-center gap-1 bg-green-500 text-white rounded-xl py-1.5 text-xs font-medium hover:bg-green-600 transition-colors">
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => updateMut.mutate({ id: p._id, status: "rejected", reason: "Does not meet listing guidelines" })}
                        disabled={updateMut.isPending}
                        className="flex-1 flex items-center justify-center gap-1 bg-red-500 text-white rounded-xl py-1.5 text-xs font-medium hover:bg-red-600 transition-colors">
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}
                  {p.status === "approved" && (
                    <button
                      onClick={() => updateMut.mutate({ id: p._id, status: "rejected" })}
                      className="w-full mt-3 bg-red-50 text-red-600 rounded-xl py-1.5 text-xs font-medium hover:bg-red-100 transition-colors">
                      Delist Product
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      {viewProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewProduct(null)}>
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10 rounded-t-2xl sm:rounded-t-3xl">
              <h2 className="font-bold text-gray-900 text-base sm:text-lg">Product Details</h2>
              <button onClick={() => setViewProduct(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Images */}
              <div className="flex gap-2 overflow-x-auto">
                {viewProduct.images?.map((img, i) => (
                  <img key={i} src={img} alt="" className="w-28 h-28 rounded-xl object-cover flex-shrink-0 border" />
                ))}
                {(!viewProduct.images || viewProduct.images.length === 0) && (
                  <div className="w-28 h-28 rounded-xl bg-gray-100 flex items-center justify-center"><Package className="w-8 h-8 text-gray-300" /></div>
                )}
              </div>

              {/* Basic info */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{viewProduct.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{viewProduct.vendorId?.brandName} · {viewProduct.category?.name || viewProduct.category}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full capitalize flex-shrink-0 ${statusBadge(viewProduct.status)}`}>
                    {viewProduct.status?.replace("_", " ")}
                  </span>
                </div>
                {viewProduct.description && <p className="text-sm text-gray-600 mt-3 leading-relaxed">{viewProduct.description}</p>}
              </div>

              {/* Variants */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Variants ({viewProduct.variants?.length || 0})</h4>
                <div className="space-y-2">
                  {viewProduct.variants?.map((v, i) => (
                    <div key={v._id || i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-sm">
                      <span className="font-medium text-gray-900 min-w-[60px]">{v.color || "Default"}</span>
                      <span className="text-gray-500">₹{v.price}</span>
                      {v.mrp > v.price && <span className="text-gray-400 line-through text-xs">₹{v.mrp}</span>}
                      <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${v.stock === 0 ? "bg-red-100 text-red-700" : v.stock <= 5 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                        Stock: {v.stock || 0}
                      </span>
                      {v.size?.length > 0 && (
                        <div className="flex gap-1">
                          {v.size.map((s, si) => <span key={si} className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded">{s}</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {viewProduct.warrantyInfo && (
                  <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
                    <Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div><p className="text-[10px] text-gray-400 uppercase">Warranty</p><p className="text-gray-700">{viewProduct.warrantyInfo}</p></div>
                  </div>
                )}
                {viewProduct.returnPolicy && (
                  <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
                    <RotateCcw className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div><p className="text-[10px] text-gray-400 uppercase">Return Policy</p><p className="text-gray-700">{viewProduct.returnPolicy}</p></div>
                  </div>
                )}
                {viewProduct.shippingInfo?.weight && (
                  <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
                    <Truck className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">Shipping</p>
                      <p className="text-gray-700">{viewProduct.shippingInfo.weight}g · {viewProduct.shippingInfo.length}×{viewProduct.shippingInfo.breadth}×{viewProduct.shippingInfo.height}cm</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
                  <Star className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Rating</p>
                    <p className="text-gray-700">{viewProduct.rating || 0} ({viewProduct.reviewCount || 0} reviews)</p>
                  </div>
                </div>
              </div>

              {viewProduct.videoUrl && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Product Video</h4>
                  <video src={viewProduct.videoUrl} controls className="w-full max-h-48 rounded-xl bg-black" />
                </div>
              )}

              {viewProduct.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {viewProduct.tags.map((t, i) => <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>)}
                </div>
              )}

              {/* Actions */}
              {viewProduct.status === "pending_approval" && (
                <div className="flex gap-3 pt-3 border-t">
                  <button
                    onClick={() => { updateMut.mutate({ id: viewProduct._id, status: "approved" }); setViewProduct(null); }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => { updateMut.mutate({ id: viewProduct._id, status: "rejected", reason: "Does not meet listing guidelines" }); setViewProduct(null); }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
