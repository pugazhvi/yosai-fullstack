import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import { Percent, Plus, Trash2, Edit2, X } from "lucide-react";

const emptySlab = () => ({ minAmount: "", maxAmount: "", rate: "" });
const emptyForm = { label: "", slabs: [emptySlab()], isDefault: false, appliedTo: "global", vendorId: "", categoryId: "" };

export default function AdminCommissions() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-commissions"],
    queryFn: async () => { const res = await api.get("/admin/commissions"); return res.data; },
  });
  const { data: vendors = [] } = useQuery({
    queryKey: ["admin-vendors-list"],
    queryFn: async () => { const res = await api.get("/admin/vendors"); return res.data || []; },
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => { const res = await api.get("/categories"); return Array.isArray(res) ? res : res.data || []; },
  });

  const createMut = useMutation({
    mutationFn: (d) => editId ? api.patch(`/admin/commissions/${editId}`, d) : api.post("/admin/commissions", d),
    onSuccess: () => {
      qc.invalidateQueries(["admin-commissions"]);
      toast.success(editId ? "Commission updated" : "Commission created");
      setShowForm(false);
      setEditId(null);
      setForm({ label: "", slabs: [emptySlab()], isDefault: false });
    },
    onError: () => toast.error("Failed to save commission"),
  });

  const commissions = data || [];

  const addSlab = () => setForm(f => ({ ...f, slabs: [...f.slabs, emptySlab()] }));
  const removeSlab = (i) => setForm(f => ({ ...f, slabs: f.slabs.filter((_, idx) => idx !== i) }));
  const setSlab = (i, key, val) => setForm(f => {
    const slabs = [...f.slabs];
    slabs[i] = { ...slabs[i], [key]: val };
    return { ...f, slabs };
  });

  const handleEdit = (c) => {
    setEditId(c._id);
    setForm({
      label: c.label,
      slabs: c.slabs.map(s => ({ minAmount: s.minAmount, maxAmount: s.maxAmount || "", rate: s.rate })),
      isDefault: c.isDefault,
      appliedTo: c.appliedTo || "global",
      vendorId: c.vendorId?._id || c.vendorId || "",
      categoryId: c.categoryId?._id || c.categoryId || "",
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const slabs = form.slabs.map(s => ({ minAmount: Number(s.minAmount), maxAmount: s.maxAmount ? Number(s.maxAmount) : undefined, rate: Number(s.rate) }));
    createMut.mutate({ ...form, slabs });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Commission Engine</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Configure dynamic commission slabs</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}
          className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Config
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-4 sm:p-6 border-2 border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">{editId ? "Edit" : "New"} Commission Config</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label *</label>
                <input className="input" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Standard Rate" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apply To</label>
                <select className="input" value={form.appliedTo} onChange={e => setForm(f => ({ ...f, appliedTo: e.target.value, vendorId: "", categoryId: "" }))}>
                  <option value="global">Global (all vendors)</option>
                  <option value="vendor">Specific Vendor</option>
                  <option value="category">Specific Category</option>
                </select>
              </div>
              {form.appliedTo === "vendor" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
                  <select className="input" value={form.vendorId} onChange={e => setForm(f => ({ ...f, vendorId: e.target.value }))} required>
                    <option value="">Select vendor</option>
                    {vendors.map(v => <option key={v._id} value={v._id}>{v.brandName}</option>)}
                  </select>
                </div>
              )}
              {form.appliedTo === "category" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select className="input" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} required>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isDefault" checked={form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} className="w-4 h-4 accent-purple-600" />
              <label htmlFor="isDefault" className="text-sm text-gray-700">Set as Default Config</label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Commission Slabs</label>
                <button type="button" onClick={addSlab} className="text-purple-600 text-sm flex items-center gap-0.5 hover:underline">
                  <Plus className="w-3.5 h-3.5" /> Add Slab
                </button>
              </div>
              <div className="space-y-2">
                {form.slabs.map((s, i) => (
                  <div key={i} className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                    <input type="number" className="input flex-1 min-w-[80px] text-sm" value={s.minAmount} onChange={e => setSlab(i, "minAmount", e.target.value)} placeholder="Min ₹" required />
                    <input type="number" className="input flex-1 min-w-[80px] text-sm" value={s.maxAmount} onChange={e => setSlab(i, "maxAmount", e.target.value)} placeholder="Max ₹ (∞)" />
                    <input type="number" className="input w-20 sm:w-24 text-sm" value={s.rate} onChange={e => setSlab(i, "rate", e.target.value)} placeholder="%" required min={0} max={100} step={0.1} />
                    <span className="text-gray-400 text-sm">%</span>
                    {form.slabs.length > 1 && (
                      <button type="button" onClick={() => removeSlab(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">Commission rate applied as % of order value within the amount range</p>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="btn-outline flex-1">Cancel</button>
              <button type="submit" disabled={createMut.isPending} className="btn-primary flex-1">
                {createMut.isPending ? "Saving..." : (editId ? "Update" : "Create")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Commission List */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : commissions.length === 0 ? (
        <div className="text-center py-16 card">
          <Percent className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No commission configs yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {commissions.map(c => (
            <div key={c._id} className={`card p-4 sm:p-5 ${c.isDefault ? "border-2 border-purple-200" : ""}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Percent className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{c.label}</p>
                      {c.isDefault && <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.5 rounded-full">Default</span>}
                      {!c.isActive && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Inactive</span>}
                    </div>
                    <p className="text-xs text-gray-400 capitalize">
                      {c.appliedTo === "global" ? "Global Config" : c.appliedTo === "category" ? `Category: ${c.categoryId?.name || "—"}` : `Vendor: ${c.vendorId?.brandName || "—"}`}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleEdit(c)} className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Slabs — card style on mobile, table on desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-100">
                      <th className="text-left py-1 font-medium">Min Amount</th>
                      <th className="text-left py-1 font-medium">Max Amount</th>
                      <th className="text-left py-1 font-medium">Commission Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {c.slabs?.map((slab, i) => (
                      <tr key={i}>
                        <td className="py-1.5">{formatPrice(slab.minAmount)}</td>
                        <td className="py-1.5">{slab.maxAmount ? formatPrice(slab.maxAmount) : "No limit"}</td>
                        <td className="py-1.5 font-semibold text-purple-600">{slab.rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="sm:hidden space-y-2">
                {c.slabs?.map((slab, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-600">
                      <span className="font-medium text-gray-900">{formatPrice(slab.minAmount)}</span>
                      <span className="mx-1">→</span>
                      <span className="font-medium text-gray-900">{slab.maxAmount ? formatPrice(slab.maxAmount) : "∞"}</span>
                    </div>
                    <span className="text-sm font-bold text-purple-600">{slab.rate}%</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
