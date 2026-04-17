import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { FileText, CheckCircle, XCircle, Clock, ExternalLink, Search, X } from "lucide-react";

const statusStyles = {
  submitted: { bg: "bg-blue-50", text: "text-blue-600", label: "Submitted" },
  pending: { bg: "bg-yellow-50", text: "text-yellow-700", label: "Pending" },
  verified: { bg: "bg-green-50", text: "text-green-700", label: "Verified" },
  approved: { bg: "bg-green-50", text: "text-green-700", label: "Approved" },
  rejected: { bg: "bg-red-50", text: "text-red-600", label: "Rejected" },
};

export default function AdminDocumentReview() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-submitted-docs", filter],
    queryFn: async () => {
      const res = await api.get(`/documents/submitted?status=${filter}`);
      return res.data || [];
    },
  });

  const verifyMut = useMutation({
    mutationFn: ({ docId, verificationStatus, adminComment }) =>
      api.patch(`/documents/vendor/${docId}/verify`, { verificationStatus, adminComment }),
    onSuccess: (_, vars) => {
      toast.success(`Document ${vars.verificationStatus}`);
      qc.invalidateQueries({ queryKey: ["admin-submitted-docs"] });
      setRejectTarget(null);
      setRejectReason("");
    },
    onError: (err) => toast.error(err?.message || "Failed to update"),
  });

  const filters = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "all", label: "All" },
  ];

  const docs = (data || []).filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    const vName = d.vendorId?.brandName || d.vendorId?.userId?.name || "";
    const docName = d.documentId?.documentName || "";
    return vName.toLowerCase().includes(q) || docName.toLowerCase().includes(q);
  });

  const handleApprove = (doc) => {
    verifyMut.mutate({ docId: doc._id, verificationStatus: "approved" });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    verifyMut.mutate({
      docId: rejectTarget._id,
      verificationStatus: "rejected",
      adminComment: rejectReason.trim(),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-purple-600" /> Document Review
        </h1>
        <p className="text-gray-500 text-sm mt-1">Review and verify vendor-submitted documents</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search by vendor or document..." value={search} onChange={e => setSearch(e.target.value)} />
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
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 card">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No documents found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3">Vendor</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3">Document</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3">File</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3">Submitted</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase px-4 lg:px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {docs.map(d => {
                  const st = statusStyles[d.verificationStatus] || statusStyles.pending;
                  const isPending = ["submitted", "pending"].includes(d.verificationStatus);
                  return (
                    <tr key={d._id} className="hover:bg-gray-50/50">
                      <td className="px-4 lg:px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{d.vendorId?.brandName || "-"}</p>
                        <p className="text-xs text-gray-400">{d.vendorId?.userId?.email}</p>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{d.documentId?.documentName}</p>
                        {d.identificationNumber && (
                          <p className="text-xs text-gray-400 font-mono">{d.identificationNumber}</p>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        {d.fileUrl ? (
                          <a href={d.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-pink-600 hover:text-pink-700 hover:underline font-medium">
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-xs text-gray-500">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatDate(d.createdAt)}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.bg} ${st.text}`}>
                          {st.label}
                        </span>
                        {d.adminComment && d.verificationStatus === "rejected" && (
                          <p className="text-[10px] text-red-500 mt-1 max-w-xs line-clamp-2">
                            Reason: {d.adminComment}
                          </p>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-right">
                        {isPending ? (
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => handleApprove(d)}
                              disabled={verifyMut.isPending}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                            >
                              <CheckCircle className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => setRejectTarget(d)}
                              disabled={verifyMut.isPending}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition-colors"
                            >
                              <XCircle className="w-3 h-3" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRejectTarget(null)}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setRejectTarget(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Reject Document</h2>
            <p className="text-sm text-gray-500 mb-4">
              Rejecting <span className="font-medium text-gray-900">{rejectTarget.documentId?.documentName}</span> for {rejectTarget.vendorId?.brandName}
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
            <textarea
              className="input"
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Explain why this document is being rejected..."
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setRejectTarget(null)} className="btn-outline flex-1">Cancel</button>
              <button
                onClick={handleReject}
                disabled={verifyMut.isPending || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-full font-medium text-sm transition-colors"
              >
                {verifyMut.isPending ? "Rejecting..." : "Reject Document"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
