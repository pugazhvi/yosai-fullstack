import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import { Tag, Plus, Pencil, Trash2, X } from "lucide-react";

const emptyForm = { code: "", discountType: "percentage", discountValue: "", minPurchaseAmount: "", maxDiscountAmount: "", validFrom: "", validTill: "", maxUsageLimit: "", isActive: true };

export default function AdminCoupons() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: () => api.get("/coupons/admin"),
  });

  const saveMut = useMutation({
    mutationFn: (payload) => editId ? api.put(`/coupons/${editId}`, payload) : api.post("/coupons", payload),
    onSuccess: () => {
      toast.success(editId ? "Coupon updated" : "Coupon created");
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      closeForm();
    },
    onError: (err) => toast.error(err?.message || "Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/coupons/${id}`),
    onSuccess: () => {
      toast.success("Coupon deleted");
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
  });

  const closeForm = () => { setShowForm(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (c) => {
    setForm({
      code: c.code, discountType: c.discountType, discountValue: c.discountValue,
      minPurchaseAmount: c.minPurchaseAmount || "", maxDiscountAmount: c.maxDiscountAmount || "",
      validFrom: c.validFrom?.slice(0, 10) || "", validTill: c.validTill?.slice(0, 10) || "",
      maxUsageLimit: c.maxUsageLimit || "", isActive: c.isActive,
    });
    setEditId(c._id);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, discountValue: Number(form.discountValue) };
    if (form.minPurchaseAmount) payload.minPurchaseAmount = Number(form.minPurchaseAmount);
    if (form.maxDiscountAmount) payload.maxDiscountAmount = Number(form.maxDiscountAmount);
    if (form.maxUsageLimit) payload.maxUsageLimit = Number(form.maxUsageLimit);
    saveMut.mutate(payload);
  };

  const coupons = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Tag className="w-6 h-6 text-purple-600" /> Coupon Management
        </h1>
        <button onClick={() => { closeForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Coupon
        </button>
      </div>

      {showForm && (
        <div className="card p-6 border-2 border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">{editId ? "Edit Coupon" : "New Coupon"}</h3>
            <button onClick={closeForm}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
              <input className="input uppercase" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SAVE20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
              <select className="input" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
                <option value="percentage">Percentage</option>
                <option value="flat">Flat Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
              <input type="number" className="input" required value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} placeholder={form.discountType === "percentage" ? "20" : "500"} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Purchase</label>
              <input type="number" className="input" value={form.minPurchaseAmount} onChange={(e) => setForm({ ...form, minPurchaseAmount: e.target.value })} placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount</label>
              <input type="number" className="input" value={form.maxDiscountAmount} onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })} placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Usage</label>
              <input type="number" className="input" value={form.maxUsageLimit} onChange={(e) => setForm({ ...form, maxUsageLimit: e.target.value })} placeholder="Unlimited" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
              <input type="date" className="input" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid Till</label>
              <input type="date" className="input" value={form.validTill} onChange={(e) => setForm({ ...form, validTill: e.target.value })} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
            <div className="md:col-span-3 flex gap-3">
              <button type="button" onClick={closeForm} className="btn-outline">Cancel</button>
              <button type="submit" disabled={saveMut.isPending} className="btn-primary">
                {saveMut.isPending ? "Saving..." : editId ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : coupons.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No coupons yet</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3">Code</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3">Discount</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3">Usage</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3">Valid</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coupons.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded">{c.code}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {c.discountType === "percentage" ? `${c.discountValue}%` : formatPrice(c.discountValue)}
                    {c.maxDiscountAmount ? ` (max ${formatPrice(c.maxDiscountAmount)})` : ""}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {c.usedCount || 0}{c.maxUsageLimit ? `/${c.maxUsageLimit}` : ""}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {c.validFrom ? formatDate(c.validFrom) : "Always"} - {c.validTill ? formatDate(c.validTill) : "Never"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${c.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Pencil className="w-4 h-4 text-gray-500" /></button>
                    <button onClick={() => { if (confirm("Delete this coupon?")) deleteMut.mutate(c._id); }} className="p-1.5 hover:bg-red-50 rounded-lg ml-1"><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
