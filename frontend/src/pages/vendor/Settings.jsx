import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { uploadToCloudinary } from "@/lib/upload";
import toast from "react-hot-toast";
import { Store, User, MapPin, Upload, Loader2, Save } from "lucide-react";

const emptyForm = {
  brandName: "",
  description: "",
  logo: "",
  address: { street: "", city: "", state: "", pincode: "", country: "India" },
};

export default function VendorSettings() {
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [userForm, setUserForm] = useState({ name: "", phone: "" });
  const [uploading, setUploading] = useState(false);

  const { data: vendor, isLoading } = useQuery({
    queryKey: ["vendor-me"],
    queryFn: async () => {
      const res = await api.get("/vendors/me");
      return res.data;
    },
  });

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await api.get("/auth/me");
      return res.data;
    },
  });

  useEffect(() => {
    if (vendor) {
      setForm({
        brandName: vendor.brandName || "",
        description: vendor.description || "",
        logo: vendor.logo || "",
        address: {
          street: vendor.address?.street || "",
          city: vendor.address?.city || "",
          state: vendor.address?.state || "",
          pincode: vendor.address?.pincode || "",
          country: vendor.address?.country || "India",
        },
      });
    }
  }, [vendor]);

  useEffect(() => {
    if (user) setUserForm({ name: user.name || "", phone: user.phone || "" });
  }, [user]);

  const saveMut = useMutation({
    mutationFn: async () => {
      await api.put("/vendors/me", form);
      await api.put("/user/profile", userForm);
    },
    onSuccess: () => {
      toast.success("Settings updated");
      qc.invalidateQueries({ queryKey: ["vendor-me"] });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err) => toast.error(err?.message || "Failed to update"),
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, "vendor-logos");
      setForm((f) => ({ ...f, logo: url }));
    } catch (err) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const setAddr = (key) => (e) => setForm((f) => ({ ...f, address: { ...f.address, [key]: e.target.value } }));
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 skeleton rounded" />
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Update your store profile and contact info</p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); saveMut.mutate(); }}
        className="space-y-6"
      >
        {/* Store Info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Store className="w-4 h-4 text-pink-600" /> Store Info
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-200">
                {form.logo ? (
                  <img src={form.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-8 h-8 text-gray-300" />
                )}
              </div>
              <label className={`btn-outline text-sm flex items-center gap-2 cursor-pointer ${uploading ? "opacity-60" : ""}`}>
                {uploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="w-4 h-4" /> {form.logo ? "Replace Logo" : "Upload Logo"}</>
                )}
                <input type="file" accept="image/*" disabled={uploading} className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name *</label>
            <input className="input" value={form.brandName} onChange={set("brandName")} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={set("description")} placeholder="Tell customers what you sell..." />
          </div>
        </div>

        {/* Contact Info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <User className="w-4 h-4 text-pink-600" /> Contact Info
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input className="input" value={userForm.name} onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input className="input" value={userForm.phone} onChange={(e) => setUserForm((f) => ({ ...f, phone: e.target.value }))} placeholder="10-digit number" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input className="input bg-gray-50" value={user?.email || ""} disabled />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
        </div>

        {/* Pickup Address */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-pink-600" /> Pickup Address
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
            <input className="input" value={form.address.street} onChange={setAddr("street")} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input className="input" value={form.address.city} onChange={setAddr("city")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input className="input" value={form.address.state} onChange={setAddr("state")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
              <input className="input" value={form.address.pincode} onChange={setAddr("pincode")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input className="input" value={form.address.country} onChange={setAddr("country")} />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saveMut.isPending}
            className="btn-primary flex items-center gap-2"
          >
            {saveMut.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
