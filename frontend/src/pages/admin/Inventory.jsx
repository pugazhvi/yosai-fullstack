import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { Package, AlertTriangle, Search, ArrowUpDown } from "lucide-react";

export default function AdminInventory() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("stock_asc");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", "all"],
    queryFn: async () => {
      const res = await api.get("/admin/products");
      return res.data || [];
    },
  });

  const products = (data || [])
    .map((p) => {
      const totalStock = p.variants?.reduce((s, v) => s + (v.stock || 0), 0) || 0;
      const lowestPrice = p.variants?.length ? Math.min(...p.variants.map((v) => v.price)) : 0;
      return { ...p, totalStock, lowestPrice };
    })
    .filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        if (!p.name?.toLowerCase().includes(q) && !p.vendorId?.brandName?.toLowerCase().includes(q)) return false;
      }
      if (filter === "out") return p.totalStock === 0;
      if (filter === "low") return p.totalStock > 0 && p.totalStock <= 5;
      if (filter === "healthy") return p.totalStock > 5;
      return true;
    })
    .sort((a, b) => {
      if (sort === "stock_asc") return a.totalStock - b.totalStock;
      if (sort === "stock_desc") return b.totalStock - a.totalStock;
      if (sort === "name") return a.name?.localeCompare(b.name);
      return 0;
    });

  const allProducts = data || [];
  const outCount = allProducts.filter((p) => (p.variants?.reduce((s, v) => s + (v.stock || 0), 0) || 0) === 0).length;
  const lowCount = allProducts.filter((p) => { const s = p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0; return s > 0 && s <= 5; }).length;

  const filters = [
    { key: "all", label: "All", count: allProducts.length },
    { key: "out", label: "Out of Stock", count: outCount },
    { key: "low", label: "Low Stock", count: lowCount },
    { key: "healthy", label: "In Stock", count: allProducts.length - outCount - lowCount },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-6 h-6 text-purple-600" /> Inventory
        </h1>
        <p className="text-gray-500 text-sm mt-1">Monitor stock levels across all products</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`card p-4 text-left transition-all ${filter === f.key ? "ring-2 ring-purple-500 bg-purple-50/50" : "hover:bg-gray-50"}`}
          >
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{f.count}</p>
            <p className="text-xs text-gray-500 mt-0.5">{f.label}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search product or vendor..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="stock_asc">Stock: Low → High</option>
          <option value="stock_desc">Stock: High → Low</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 card">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No products match your filters</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3">Product</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3">Vendor</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3">Price</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3">
                    <button onClick={() => setSort((s) => s === "stock_asc" ? "stock_desc" : "stock_asc")} className="flex items-center gap-1 hover:text-gray-700">
                      Stock <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3">Variants</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p) => {
                  const isOut = p.totalStock === 0;
                  const isLow = p.totalStock > 0 && p.totalStock <= 5;
                  return (
                    <tr key={p._id} className={`hover:bg-gray-50/50 ${isOut ? "bg-red-50/30" : ""}`}>
                      <td className="px-4 lg:px-6 py-3">
                        <div className="flex items-center gap-3">
                          <img src={p.images?.[0] || "/placeholder.jpg"} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">{p.name}</p>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-sm text-gray-600">{p.vendorId?.brandName || "-"}</td>
                      <td className="px-4 lg:px-6 py-3 text-sm font-medium text-gray-900">{formatPrice(p.lowestPrice)}</td>
                      <td className="px-4 lg:px-6 py-3">
                        <div className="flex items-center gap-1.5">
                          {(isOut || isLow) && <AlertTriangle className={`w-3.5 h-3.5 ${isOut ? "text-red-500" : "text-amber-500"}`} />}
                          <span className={`text-sm font-bold ${isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-green-600"}`}>{p.totalStock}</span>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3">
                        <div className="flex flex-wrap gap-1">
                          {p.variants?.map((v) => (
                            <span key={v._id} className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${v.stock === 0 ? "bg-red-100 text-red-700" : v.stock <= 5 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                              {v.color || "Default"}: {v.stock}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${p.status === "approved" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {p.status?.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
