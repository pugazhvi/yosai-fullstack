import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { FileText, Plus, Pencil, X } from "lucide-react";

const emptyForm = { documentName: "", documentCode: "", documentType: "image", isRequired: true, applicableRoles: ["vendor"], sortOrder: 0 };

export default function AdminDocuments() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-documents"],
    queryFn: async () => { const res = await api.get("/documents/master"); return res.data; },
  });

  const saveMut = useMutation({
    mutationFn: (payload) => editId ? api.put(`/documents/master/${editId}`, payload) : api.post("/documents/master", payload),
    onSuccess: () => {
      toast.success(editId ? "Updated" : "Created");
      qc.invalidateQueries({ queryKey: ["admin-documents"] });
      closeForm();
    },
    onError: (err) => toast.error(err?.message || "Failed"),
  });

  const closeForm = () => { setShowForm(false); setEditId(null); setForm(emptyForm); };
  const openEdit = (d) => {
    setForm({ documentName: d.documentName, documentCode: d.documentCode, documentType: d.documentType, isRequired: d.isRequired, applicableRoles: d.applicableRoles || ["vendor"], sortOrder: d.sortOrder || 0 });
    setEditId(d._id);
    setShowForm(true);
  };

  const documents = Array.isArray(data) ? data : data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-purple-600" /> Document Masters
        </h1>
        <button onClick={() => { closeForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Document Type
        </button>
      </div>

      {showForm && (
        <div className="card p-6 border-2 border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">{editId ? "Edit Document Type" : "New Document Type"}</h3>
            <button onClick={closeForm}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); saveMut.mutate(form); }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document Name</label>
              <input className="input" required value={form.documentName} onChange={(e) => setForm({ ...form, documentName: e.target.value })} placeholder="PAN Card" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
              <input className="input uppercase" required value={form.documentCode} onChange={(e) => setForm({ ...form, documentCode: e.target.value.toUpperCase() })} placeholder="PAN" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select className="input" value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value })}>
                <option value="image">Image</option>
                <option value="pdf">PDF</option>
                <option value="text">Text</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input type="number" className="input" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isRequired} onChange={(e) => setForm({ ...form, isRequired: e.target.checked })} className="rounded" />
                <span className="text-sm text-gray-700">Required</span>
              </label>
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={saveMut.isPending} className="btn-primary">{saveMut.isPending ? "Saving..." : editId ? "Update" : "Create"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : documents.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No document types configured</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3">Code</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3">Required</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {documents.map((d) => (
                <tr key={d._id} className="hover:bg-gray-50/50">
                  <td className="px-4 lg:px-6 py-4 text-sm font-medium text-gray-900">{d.documentName}</td>
                  <td className="px-4 lg:px-6 py-4"><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{d.documentCode}</span></td>
                  <td className="px-4 lg:px-6 py-4 text-sm text-gray-500 capitalize">{d.documentType}</td>
                  <td className="px-4 lg:px-6 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${d.isRequired ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"}`}>
                      {d.isRequired ? "Required" : "Optional"}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${d.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {d.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-4 text-right">
                    <button onClick={() => openEdit(d)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Pencil className="w-4 h-4 text-gray-500" /></button>
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
