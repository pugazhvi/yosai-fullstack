import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { MessageSquare, Phone, Scissors, Eye, Trash2, CheckCircle, X, Mail, Clock, Search } from "lucide-react";

const typeConfig = {
  contact: { icon: MessageSquare, label: "Contact", color: "bg-blue-100 text-blue-700" },
  callback: { icon: Phone, label: "Callback", color: "bg-amber-100 text-amber-700" },
  booking: { icon: Scissors, label: "Booking", color: "bg-pink-100 text-pink-700" },
};

const statusConfig = {
  new: { label: "New", color: "bg-red-100 text-red-700" },
  seen: { label: "Seen", color: "bg-blue-100 text-blue-700" },
  replied: { label: "Replied", color: "bg-green-100 text-green-700" },
  resolved: { label: "Resolved", color: "bg-gray-100 text-gray-700" },
  archived: { label: "Archived", color: "bg-gray-100 text-gray-500" },
};

export default function AdminInquiries() {
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [adminNote, setAdminNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-inquiries", typeFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await api.get(`/inquiries?${params}`);
      return res.data || [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["inquiry-stats"],
    queryFn: async () => { const res = await api.get("/inquiries/stats"); return res.data; },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...body }) => api.patch(`/inquiries/${id}`, body),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin-inquiries"] });
      qc.invalidateQueries({ queryKey: ["inquiry-stats"] });
    },
    onError: (err) => toast.error(err?.message || "Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/inquiries/${id}`),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-inquiries"] });
      qc.invalidateQueries({ queryKey: ["inquiry-stats"] });
      setSelected(null);
    },
  });

  const inquiries = (data || []).filter(i => {
    if (!search) return true;
    const q = search.toLowerCase();
    return i.name?.toLowerCase().includes(q) || i.email?.toLowerCase().includes(q) || i.phone?.includes(q);
  });

  const openDetail = (inq) => {
    setSelected(inq);
    setAdminNote(inq.adminNote || "");
    if (inq.status === "new") updateMut.mutate({ id: inq._id, status: "seen" });
  };

  const statCards = [
    { key: "all", label: "Total", count: stats?.total || 0 },
    { key: "new", label: "New", count: stats?.new || 0 },
    { key: "contact", label: "Contacts", count: stats?.contacts || 0, isType: true },
    { key: "callback", label: "Callbacks", count: stats?.callbacks || 0, isType: true },
    { key: "booking", label: "Bookings", count: stats?.bookings || 0, isType: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" /> Messages & Inquiries
        </h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">Contact forms, callback requests, and stitch bookings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
        {statCards.map(s => (
          <button
            key={s.key}
            onClick={() => s.isType ? setTypeFilter(s.key) : (s.key === "new" ? setStatusFilter("new") : (setTypeFilter("all"), setStatusFilter("all")))}
            className={`card p-3 text-left transition-all ${(s.isType ? typeFilter === s.key : s.key === "new" ? statusFilter === "new" : typeFilter === "all" && statusFilter === "all") ? "ring-2 ring-purple-500 bg-purple-50/50" : "hover:bg-gray-50"}`}
          >
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{s.count}</p>
            <p className="text-[10px] sm:text-xs text-gray-500">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search by name, email, phone..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "new", "seen", "replied", "resolved"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm font-medium capitalize transition-all ${statusFilter === s ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : inquiries.length === 0 ? (
        <div className="text-center py-16 card">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No inquiries found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {inquiries.map(inq => {
            const tc = typeConfig[inq.type] || typeConfig.contact;
            const sc = statusConfig[inq.status] || statusConfig.new;
            const TypeIcon = tc.icon;
            return (
              <div
                key={inq._id}
                onClick={() => openDetail(inq)}
                className={`card p-3 sm:p-4 cursor-pointer hover:shadow-md transition-all ${inq.status === "new" ? "border-l-4 border-l-red-500 bg-red-50/30" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${tc.color.split(" ")[0]} flex items-center justify-center flex-shrink-0`}>
                    <TypeIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${tc.color.split(" ")[1]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">{inq.name}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tc.color}`}>{tc.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${sc.color}`}>{sc.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                      {inq.message || inq.serviceType || `Callback: ${inq.phone}`}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                      {inq.email && <span className="flex items-center gap-0.5"><Mail className="w-3 h-3" /> {inq.email}</span>}
                      {inq.phone && <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" /> {inq.phone}</span>}
                      <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {formatDate(inq.createdAt)}</span>
                    </div>
                  </div>
                  <Eye className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10 rounded-t-2xl sm:rounded-t-3xl">
              <h2 className="font-bold text-gray-900 text-base sm:text-lg">Inquiry Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              {/* Type + Status */}
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeConfig[selected.type]?.color}`}>{typeConfig[selected.type]?.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig[selected.status]?.color}`}>{statusConfig[selected.status]?.label}</span>
                <span className="text-xs text-gray-400 ml-auto">{formatDate(selected.createdAt)}</span>
              </div>

              {/* Contact info */}
              <div className="space-y-2 p-3 bg-gray-50 rounded-xl">
                <div className="flex justify-between"><span className="text-xs text-gray-500">Name</span><span className="text-sm font-medium text-gray-900">{selected.name}</span></div>
                {selected.email && <div className="flex justify-between"><span className="text-xs text-gray-500">Email</span><span className="text-sm text-gray-900">{selected.email}</span></div>}
                {selected.phone && <div className="flex justify-between"><span className="text-xs text-gray-500">Phone</span><a href={`tel:${selected.phone}`} className="text-sm text-pink-600 font-medium">{selected.phone}</a></div>}
              </div>

              {/* Message */}
              {selected.message && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Message</p>
                  <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 p-3 rounded-xl">{selected.message}</p>
                </div>
              )}

              {/* Booking details */}
              {selected.type === "booking" && (
                <div className="space-y-2 p-3 bg-pink-50 rounded-xl">
                  {selected.serviceType && <div className="flex justify-between"><span className="text-xs text-gray-500">Service</span><span className="text-sm font-medium">{selected.serviceType}</span></div>}
                  {selected.preferredDate && <div className="flex justify-between"><span className="text-xs text-gray-500">Preferred Date</span><span className="text-sm">{selected.preferredDate}</span></div>}
                  {selected.measurements && <div className="flex justify-between"><span className="text-xs text-gray-500">Measurements</span><span className="text-sm">{selected.measurements}</span></div>}
                  {selected.fabricDescription && <div><span className="text-xs text-gray-500">Fabric</span><p className="text-sm mt-0.5">{selected.fabricDescription}</p></div>}
                  {selected.notes && <div><span className="text-xs text-gray-500">Notes</span><p className="text-sm mt-0.5">{selected.notes}</p></div>}
                </div>
              )}

              {/* Callback details */}
              {selected.type === "callback" && selected.preferredTime && (
                <div className="p-3 bg-amber-50 rounded-xl">
                  <div className="flex justify-between"><span className="text-xs text-gray-500">Preferred Time</span><span className="text-sm font-medium">{selected.preferredTime}</span></div>
                </div>
              )}

              {/* Admin note */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Admin Note</label>
                <textarea
                  className="input text-sm"
                  rows={2}
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="Add internal note..."
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <select
                  className="input text-sm flex-1 min-w-[120px]"
                  value={selected.status}
                  onChange={e => { updateMut.mutate({ id: selected._id, status: e.target.value, adminNote }); setSelected({ ...selected, status: e.target.value }); }}
                >
                  <option value="new">New</option>
                  <option value="seen">Seen</option>
                  <option value="replied">Replied</option>
                  <option value="resolved">Resolved</option>
                  <option value="archived">Archived</option>
                </select>
                <button
                  onClick={() => updateMut.mutate({ id: selected._id, adminNote })}
                  disabled={updateMut.isPending}
                  className="btn-primary text-sm flex items-center gap-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Save Note
                </button>
                <button
                  onClick={() => { if (window.confirm("Delete this inquiry?")) deleteMut.mutate(selected._id); }}
                  className="px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>

              {/* Quick actions */}
              <div className="flex gap-2">
                {selected.phone && (
                  <a href={`tel:${selected.phone}`} className="flex-1 btn-outline text-sm text-center flex items-center justify-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                )}
                {selected.email && (
                  <a href={`mailto:${selected.email}`} className="flex-1 btn-outline text-sm text-center flex items-center justify-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </a>
                )}
                {selected.phone && (
                  <a href={`https://wa.me/${selected.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="flex-1 btn-primary text-sm text-center flex items-center justify-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
