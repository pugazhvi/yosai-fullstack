import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatPrice, formatDate, statusColor } from "@/lib/utils";
import toast from "react-hot-toast";
import { ChevronLeft, Store, MapPin, CreditCard, FileText, Package, CheckCircle, XCircle } from "lucide-react";

export default function VendorDetail() {
  const { id } = useParams();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-vendor", id],
    queryFn: async () => {
      const res = await api.get(`/admin/vendors/${id}`);
      return res.data;
    },
  });

  const updateMut = useMutation({
    mutationFn: (status) => api.patch(`/admin/vendors/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries(["admin-vendor", id]);
      qc.invalidateQueries(["admin-vendors"]);
      toast.success("Vendor status updated");
    },
    onError: () => toast.error("Failed to update"),
  });

  if (isLoading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />)}
    </div>
  );

  const inner = data?.vendor ? data : data?.data || {};
  const vendor = inner?.vendor;
  const vendorProducts = inner?.products || [];
  const totalOrders = inner?.totalOrders || 0;
  const walletBalance = inner?.walletBalance || 0;
  if (!vendor) return <div className="text-center py-16 text-gray-400">Vendor not found</div>;

  const statusBadge = { pending: "bg-yellow-100 text-yellow-700", approved: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700", suspended: "bg-gray-100 text-gray-700" };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link to="/admin/vendors" className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm">
          <ChevronLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {vendor.logo ? (
              <img src={vendor.logo} alt={vendor.brandName} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 brand-gradient rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                {vendor.brandName?.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{vendor.brandName}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusBadge[vendor.status]}`}>{vendor.status}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {vendor.status === "pending" && (
            <>
              <button onClick={() => updateMut.mutate("approved")} className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-xl text-sm hover:bg-green-600">
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
              <button onClick={() => updateMut.mutate("rejected")} className="flex items-center gap-1 px-4 py-2 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600">
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </>
          )}
          {vendor.status === "approved" && (
            <button onClick={() => updateMut.mutate("suspended")} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-300">Suspend</button>
          )}
          {vendor.status === "suspended" && (
            <button onClick={() => updateMut.mutate("approved")} className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm hover:bg-green-600">Reactivate</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Store Info */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4"><Store className="w-4 h-4 text-pink-600" /> Store Info</h2>
          {vendor.logo && (
            <div className="flex justify-center mb-4">
              <img src={vendor.logo} alt={vendor.brandName} className="w-20 h-20 rounded-xl object-cover border border-gray-100" />
            </div>
          )}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Brand Name</span><span className="font-medium">{vendor.brandName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{vendor.userId?.email}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-medium">{vendor.phone}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Category</span><span className="font-medium capitalize">{vendor.category || "-"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Joined</span><span className="font-medium">{formatDate(vendor.createdAt)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Total Revenue</span><span className="font-bold text-pink-600">{formatPrice(vendor.totalRevenue || 0)}</span></div>
          </div>
          {vendor.description && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-gray-400 mb-1">Description</p>
              <p className="text-sm text-gray-600">{vendor.description}</p>
            </div>
          )}
        </div>

        {/* Address */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4"><MapPin className="w-4 h-4 text-pink-600" /> Pickup Address</h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p>{vendor.address?.street}</p>
            <p>{vendor.address?.city}, {vendor.address?.state}</p>
            <p>{vendor.address?.pincode}, {vendor.address?.country}</p>
          </div>
        </div>

        {/* KYC */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4"><FileText className="w-4 h-4 text-pink-600" /> KYC Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">GST</span><span className="font-mono">{vendor.kyc?.gstNumber || "-"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">PAN</span><span className="font-mono">{vendor.kyc?.panNumber || "-"}</span></div>
          </div>
        </div>

        {/* Bank */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4"><CreditCard className="w-4 h-4 text-pink-600" /> Bank Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Account Holder</span><span className="font-medium">{vendor.kyc?.accountHolderName || "-"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Account No.</span><span className="font-mono">{vendor.kyc?.accountNumber ? `****${vendor.kyc.accountNumber.slice(-4)}` : "-"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">IFSC</span><span className="font-mono">{vendor.kyc?.ifscCode || "-"}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Bank</span><span className="font-medium">{vendor.kyc?.bankName || "-"}</span></div>
          </div>
        </div>
      </div>

      <VendorSubmittedDocs vendorId={vendor._id} />
    </div>
  );
}

function VendorSubmittedDocs({ vendorId }) {
  const { data } = useQuery({
    queryKey: ["vendor-docs", vendorId],
    queryFn: async () => {
      const res = await api.get(`/documents/vendor/${vendorId}`);
      return res.data || [];
    },
    enabled: !!vendorId,
  });

  const docs = data || [];
  if (docs.length === 0) return null;

  const statusColors = {
    submitted: "bg-blue-100 text-blue-700",
    pending: "bg-yellow-100 text-yellow-700",
    verified: "bg-green-100 text-green-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <div className="card p-6">
      <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-pink-600" /> Submitted Documents
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {docs.map((d) => {
          const isImage = d.fileUrl?.match(/\.(jpg|jpeg|png|gif|webp)/i) || d.fileUrl?.includes("/image/");
          return (
            <a key={d._id} href={d.fileUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors group">
              {isImage ? (
                <img src={d.fileUrl} alt={d.documentId?.documentName} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-200" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-pink-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
                  {d.documentId?.documentName || "Document"}
                </p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${statusColors[d.verificationStatus] || "bg-gray-100 text-gray-600"}`}>
                  {d.verificationStatus}
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
