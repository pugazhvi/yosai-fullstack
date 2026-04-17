import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Headphones, MessageSquare, ChevronRight, X } from "lucide-react";

const statusColors = {
  open: "bg-blue-50 text-blue-700",
  in_progress: "bg-yellow-50 text-yellow-700",
  resolved: "bg-green-50 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};
const priorityColors = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-orange-50 text-orange-700",
  urgent: "bg-red-50 text-red-700",
};

export default function AdminSupportTickets() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tickets", statusFilter],
    queryFn: () => api.get(`/support/admin/tickets?status=${statusFilter}`),
  });

  const detailQ = useQuery({
    queryKey: ["admin-ticket", selected],
    queryFn: () => api.get(`/support/admin/tickets/${selected}`),
    enabled: !!selected,
  });

  const replyMut = useMutation({
    mutationFn: (msg) => api.post(`/support/admin/tickets/${selected}/reply`, { message: msg }),
    onSuccess: () => {
      setReply("");
      qc.invalidateQueries({ queryKey: ["admin-ticket", selected] });
    },
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/support/admin/tickets/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tickets"] });
      qc.invalidateQueries({ queryKey: ["admin-ticket", selected] });
    },
  });

  const tickets = data?.data || [];
  const ticket = detailQ.data?.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Headphones className="w-6 h-6 text-purple-600" /> Support Tickets
        </h1>
        <select className="input w-full sm:w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-1 card p-0 overflow-hidden max-h-[75vh] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : tickets.length === 0 ? (
            <p className="text-center text-gray-400 py-12">No tickets</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {tickets.map((t) => (
                <button key={t._id} onClick={() => setSelected(t._id)} className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selected === t._id ? "bg-purple-50 border-l-4 border-purple-600" : ""}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-gray-400">#{t.ticketNumber}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[t.status]}`}>{t.status?.replace("_", " ")}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{t.subject}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${priorityColors[t.priority]}`}>{t.priority}</span>
                    <span className="text-xs text-gray-400">{t.category}</span>
                    <ChevronRight className="w-3 h-3 text-gray-300 ml-auto" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ticket Detail */}
        <div className="lg:col-span-2 card p-6">
          {!selected ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Select a ticket to view details</p>
              </div>
            </div>
          ) : !ticket ? (
            <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-mono text-gray-400">#{ticket.ticketNumber}</p>
                  <h3 className="text-lg font-bold text-gray-900">{ticket.subject}</h3>
                  <p className="text-sm text-gray-500 mt-1">by {ticket.userId?.name || "User"} &middot; {formatDate(ticket.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="input text-xs py-1 px-2"
                    value={ticket.status}
                    onChange={(e) => statusMut.mutate({ id: ticket._id, status: e.target.value })}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-700">{ticket.description}</p>
              </div>
              {/* Replies */}
              <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                {ticket.replies?.map((r, i) => (
                  <div key={i} className={`p-3 rounded-xl ${r.senderRole === "admin" ? "bg-purple-50 ml-4 lg:ml-8" : "bg-gray-50 mr-4 lg:mr-8"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">{r.senderRole === "admin" ? "Admin" : "User"}</span>
                      <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700">{r.message}</p>
                  </div>
                ))}
              </div>
              {/* Reply Form */}
              {ticket.status !== "closed" && (
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Type your reply..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && reply.trim() && replyMut.mutate(reply)}
                  />
                  <button
                    onClick={() => reply.trim() && replyMut.mutate(reply)}
                    disabled={replyMut.isPending || !reply.trim()}
                    className="btn-primary px-4"
                  >
                    {replyMut.isPending ? "..." : "Send"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
