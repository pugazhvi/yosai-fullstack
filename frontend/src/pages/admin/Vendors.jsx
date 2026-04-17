import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { Store, Search, CheckCircle, XCircle, ChevronRight } from "lucide-react";

const statusBadge = (s) => {
  const map = { pending: "bg-yellow-100 text-yellow-700", approved: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700", suspended: "bg-gray-100 text-gray-700" };
  return map[s] || "bg-gray-100 text-gray-600";
};

export default function AdminVendors() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-vendors", filter],
    queryFn: async () => {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const res = await api.get(`/admin/vendors${params}`);
      return res.data;
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/vendors/${id}/status`, { status }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries(["admin-vendors"]);
      toast.success(`Vendor ${vars.status}`);
    },
    onError: () => toast.error("Failed to update status"),
  });

  const vendorList = Array.isArray(data) ? data : data?.data || [];
  const vendors = vendorList.filter(v =>
    !search || v.brandName?.toLowerCase().includes(search.toLowerCase()) || v.userId?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const filters = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "suspended", label: "Suspended" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Vendors</h1>
        <p className="text-gray-500 text-sm mt-1">Manage vendor applications and accounts</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${filter === f.key ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-16 card">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No vendors found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vendors.map(vendor => (
            <div key={vendor._id} className="card p-3 sm:p-5">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 brand-gradient rounded-xl flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                  {vendor.brandName?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-sm truncate">{vendor.brandName}</p>
                    <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${statusBadge(vendor.status)}`}>{vendor.status}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400 truncate">{vendor.userId?.email}</p>
                  <p className="text-[10px] sm:text-xs text-gray-400">Joined {formatDate(vendor.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 sm:mt-0 sm:absolute sm:right-5 sm:top-1/2 sm:-translate-y-1/2 flex-wrap">
                {vendor.status === "pending" && (
                  <>
                    <button onClick={() => updateMut.mutate({ id: vendor._id, status: "approved" })}
                      className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-green-500 text-white rounded-xl text-xs sm:text-sm hover:bg-green-600 transition-colors">
                      <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Approve
                    </button>
                    <button onClick={() => updateMut.mutate({ id: vendor._id, status: "rejected" })}
                      className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-red-500 text-white rounded-xl text-xs sm:text-sm hover:bg-red-600 transition-colors">
                      <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Reject
                    </button>
                  </>
                )}
                {vendor.status === "approved" && (
                  <button onClick={() => updateMut.mutate({ id: vendor._id, status: "suspended" })}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-300 transition-colors">
                    Suspend
                  </button>
                )}
                {vendor.status === "suspended" && (
                  <button onClick={() => updateMut.mutate({ id: vendor._id, status: "approved" })}
                    className="px-3 py-1.5 bg-green-500 text-white rounded-xl text-sm hover:bg-green-600 transition-colors">
                    Reactivate
                  </button>
                )}
                <Link to={`/admin/vendors/${vendor._id}`} className="p-2 text-gray-400 hover:text-gray-600">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
