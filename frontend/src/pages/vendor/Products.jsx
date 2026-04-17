import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatPrice, statusColor } from "@/lib/utils";
import toast from "react-hot-toast";
import { Plus, Package, Pencil, Trash2, AlertTriangle, PackagePlus } from "lucide-react";

export default function VendorProducts() {
  const qc = useQueryClient();
  const [deleting, setDeleting] = useState(null);
  const [stockEdit, setStockEdit] = useState(null);
  const [stockVal, setStockVal] = useState("");

  const stockMut = useMutation({
    mutationFn: ({ productId, variantId, stock }) => api.patch(`/products/${productId}/stock`, { variantId, stock: Number(stock) }),
    onSuccess: () => {
      toast.success("Stock updated");
      qc.invalidateQueries({ queryKey: ["vendor-products"] });
      setStockEdit(null);
    },
    onError: (err) => toast.error(err?.message || "Failed"),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-products"],
    queryFn: async () => {
      const res = await api.get("/products/vendor/my");
      return res.data;
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(["vendor-products"]);
      toast.success("Product deleted");
      setDeleting(null);
    },
    onError: () => toast.error("Failed to delete product"),
  });

  const products = data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} product(s) listed</p>
        </div>
        <Link to="/vendor/products/add" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 card">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No products yet</p>
          <p className="text-gray-400 text-sm mt-1">Start by adding your first product</p>
          <Link to="/vendor/products/add" className="btn-primary inline-flex items-center gap-2 mt-4">
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => {
            const mainVariant = p.variants?.[0];
            const lowestPrice = p.variants?.length ? Math.min(...p.variants.map(v => v.price)) : 0;
            const totalStock = p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0);
            const isLowStock = totalStock <= 5 && totalStock > 0;
            const isOutOfStock = totalStock === 0;

            return (
              <div key={p._id} className="card overflow-hidden">
                <div className="relative">
                  <img
                    src={p.images?.[0] || "/placeholder.jpg"}
                    alt={p.name}
                    className="w-full h-44 object-cover"
                  />
                  <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full capitalize ${statusColor(p.status)}`}>
                    {p.status?.replace("_", " ")}
                  </span>
                  {(isLowStock || isOutOfStock) && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" />
                      {isOutOfStock ? "Out of Stock" : "Low Stock"}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{p.name}</h3>
                  <p className="text-gray-400 text-xs mt-0.5 capitalize">{p.category?.name || p.category}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="font-bold text-gray-900">{formatPrice(lowestPrice)}</p>
                    <p className="text-xs text-gray-500">Stock: {totalStock}</p>
                  </div>
                  {/* Quick stock edit */}
                  {stockEdit === p._id ? (
                    <div className="mt-2 flex gap-1.5 items-center">
                      {p.variants?.map((v, vi) => (
                        <div key={v._id} className="flex-1 flex flex-col gap-1">
                          <span className="text-[10px] text-gray-400 truncate">{v.color || `V${vi + 1}`}</span>
                          <input
                            type="number"
                            min="0"
                            defaultValue={v.stock || 0}
                            className="input text-xs py-1 text-center"
                            onChange={(e) => setStockVal({ variantId: v._id, stock: e.target.value })}
                          />
                        </div>
                      ))}
                      <div className="flex flex-col gap-1 pt-3">
                        <button
                          onClick={() => stockVal && stockMut.mutate({ productId: p._id, ...stockVal })}
                          disabled={stockMut.isPending}
                          className="bg-green-500 text-white text-[10px] px-2 py-1 rounded-lg font-medium"
                        >
                          {stockMut.isPending ? "..." : "Save"}
                        </button>
                        <button onClick={() => setStockEdit(null)} className="text-[10px] text-gray-500 hover:text-gray-700">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setStockEdit(p._id)}
                      className="mt-2 w-full flex items-center justify-center gap-1 text-[11px] text-gray-500 hover:text-pink-600 py-1 hover:bg-pink-50 rounded-lg transition-colors"
                    >
                      <PackagePlus className="w-3 h-3" /> Update Stock
                    </button>
                  )}

                  <div className="flex gap-2 mt-2">
                    <Link to={`/vendor/products/edit/${p._id}`} className="flex-1 btn-outline py-1.5 text-xs flex items-center justify-center gap-1">
                      <Pencil className="w-3 h-3" /> Edit
                    </Link>
                    {deleting === p._id ? (
                      <div className="flex gap-1 flex-1">
                        <button onClick={() => deleteMut.mutate(p._id)} className="flex-1 bg-red-500 text-white rounded-xl text-xs py-1.5">Confirm</button>
                        <button onClick={() => setDeleting(null)} className="flex-1 btn-outline text-xs py-1.5">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleting(p._id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
