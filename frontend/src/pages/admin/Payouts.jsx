import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { Banknote, CheckCircle, XCircle, Clock, Search } from "lucide-react";

const statusBadge = (s) => ({
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  processing: "bg-blue-100 text-blue-700",
}[s] || "bg-gray-100 text-gray-600");

export default function AdminPayouts() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payouts", filter],
    queryFn: async () => {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const res = await api.get(`/admin/payouts${params}`);
      return res.data;
    },
  });

  const approveMut = useMutation({
    mutationFn: ({ id, action, adminNote }) =>
      api.patch(`/admin/payouts/${id}/${action}`, { adminNote }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries(["admin-payouts"]);
      toast.success(`Payout ${vars.action === "approve" ? "approved" : "rejected"}`);
    },
    onError: () => toast.error("Failed to process payout"),
  });

  const payouts = (data || []).filter(p =>
    !search || p.vendorId?.brandName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPending = payouts.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);

  const filters = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Payouts</h1>
          <p className="text-gray-500 text-sm mt-1">Process vendor payout requests</p>
        </div>
        {filter === "pending" && payouts.length > 0 && (
          <div className="brand-gradient text-white px-4 py-2 rounded-xl text-sm font-medium">
            Pending: {formatPrice(totalPending)}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search by vendor name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${filter === f.key ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : payouts.length === 0 ? (
        <div className="text-center py-16 card">
          <Banknote className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No {filter !== "all" ? filter : ""} payout requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payouts.map(payout => (
            <div key={payout._id} className="card p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 brand-gradient rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {payout.vendorId?.brandName?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{payout.vendorId?.brandName}</p>
                    <p className="text-xs text-gray-400">{payout.vendorId?.userId?.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatPrice(payout.amount)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(payout.status)}`}>{payout.status}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                <Clock className="w-3.5 h-3.5" />
                Requested {formatDate(payout.createdAt)}
                {payout.kyc?.accountHolderName && (
                  <span className="ml-2">· {payout.kyc.bankName} ****{payout.kyc.accountNumber?.slice(-4)}</span>
                )}
              </div>

              {payout.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => approveMut.mutate({ id: payout._id, action: "approve" })}
                    disabled={approveMut.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 text-white rounded-xl py-2 text-sm font-medium hover:bg-green-600 transition-colors">
                    <CheckCircle className="w-4 h-4" /> Approve & Pay
                  </button>
                  <button
                    onClick={() => approveMut.mutate({ id: payout._id, action: "reject" })}
                    disabled={approveMut.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 text-red-600 rounded-xl py-2 text-sm font-medium hover:bg-red-100 transition-colors">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}

              {payout.transactionRef && (
                <p className="text-xs text-gray-400 mt-2">Ref: {payout.transactionRef}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
