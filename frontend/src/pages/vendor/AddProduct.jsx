import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Plus, Trash2, Upload, Package } from "lucide-react";

const COLORS = ["Black", "White", "Red", "Blue", "Green", "Yellow", "Pink", "Purple", "Grey", "Brown", "Navy", "Beige"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "Free Size"];

const emptyVariant = () => ({ color: "", sizes: [{ size: "Free Size", stock: 10 }], price: "", mrp: "", sku: "" });

export default function AddProduct() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { id } = useParams();
  const isEdit = !!id;
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [form, setForm] = useState({
    name: "", description: "", category: "", images: [], videoUrl: "", featured: false,
    variants: [emptyVariant()],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return Array.isArray(res) ? res : res.data || [];
    },
  });

  const { data: existing } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await api.get(`/products/${id}`);
      return res.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (!existing) return;
    setForm({
      name: existing.name || "",
      description: existing.description || "",
      category: existing.category?._id || existing.category || "",
      images: existing.images || [],
      videoUrl: existing.videoUrl || "",
      featured: existing.featured || false,
      variants: (existing.variants || []).map(v => ({
        color: v.color || "",
        sizes: (v.size || []).length
          ? v.size.map(sz => ({ size: sz, stock: v.stock || 0 }))
          : [{ size: "Free Size", stock: v.stock || 0 }],
        price: v.price || "",
        mrp: v.mrp || "",
        sku: v.sku || "",
      })),
    });
  }, [existing]);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));
  const setV = (i, key, val) => setForm(f => {
    const variants = [...f.variants];
    variants[i] = { ...variants[i], [key]: val };
    return { ...f, variants };
  });

  const addSize = (vi) => {
    const v = form.variants[vi];
    if (v.sizes.length >= SIZES.length) return;
    setV(vi, "sizes", [...v.sizes, { size: "", stock: 10 }]);
  };

  const setSize = (vi, si, key, val) => setForm(f => {
    const variants = [...f.variants];
    const sizes = [...variants[vi].sizes];
    sizes[si] = { ...sizes[si], [key]: val };
    variants[vi] = { ...variants[vi], sizes };
    return { ...f, variants };
  });

  const removeSize = (vi, si) => setForm(f => {
    const variants = [...f.variants];
    variants[vi] = { ...variants[vi], sizes: variants[vi].sizes.filter((_, i) => i !== si) };
    return { ...f, variants };
  });

  const addVariant = () => setForm(f => ({ ...f, variants: [...f.variants, emptyVariant()] }));
  const removeVariant = (i) => setForm(f => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }));

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setForm(f => ({ ...f, images: [...f.images, ev.target.result] }));
      reader.readAsDataURL(file);
    });
  };

  const createCatMut = useMutation({
    mutationFn: (name) => api.post("/categories/request", { name }),
    onSuccess: (res) => {
      const newCat = res.data;
      qc.invalidateQueries({ queryKey: ["categories"] });
      setForm(f => ({ ...f, category: newCat._id }));
      setNewCatName("");
      setShowNewCat(false);
      toast.success(`Category "${newCat.name}" added`);
    },
    onError: (err) => toast.error(err?.message || "Failed to create category"),
  });

  const handleCreateCategory = () => {
    if (!newCatName.trim()) return;
    createCatMut.mutate(newCatName.trim());
  };

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? api.put(`/products/${id}`, data) : api.post("/products", data),
    onSuccess: () => {
      qc.invalidateQueries(["vendor-products"]);
      toast.success(isEdit ? "Product updated!" : "Product submitted for approval!");
      navigate("/vendor/products");
    },
    onError: (err) => toast.error(err?.message || "Failed to save product"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.category || form.variants.length === 0) {
      return toast.error("Please fill all required fields");
    }
    const variants = form.variants.map(v => ({
      color: v.color,
      price: Number(v.price),
      mrp: Number(v.mrp),
      sku: v.sku,
      size: v.sizes.map(s => s.size).filter(Boolean),
      stock: v.sizes.reduce((sum, s) => sum + Number(s.stock || 0), 0),
      images: form.images,
    }));
    mutation.mutate({ ...form, variants });
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? "Edit Product" : "Add Product"}</h1>
        <p className="text-gray-500 text-sm mt-1">{isEdit ? "Update your product details" : "Product will be reviewed before going live"}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2"><Package className="w-4 h-4 text-pink-600" /> Basic Info</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input className="input" value={form.name} onChange={set("name")} placeholder="e.g. Classic Cotton T-Shirt" required />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Category *</label>
              <button
                type="button"
                onClick={() => setShowNewCat(v => !v)}
                className="text-xs text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> {showNewCat ? "Cancel" : "Create new"}
              </button>
            </div>
            {showNewCat ? (
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="New category name"
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={createCatMut.isPending || !newCatName.trim()}
                  className="btn-primary px-4 text-sm whitespace-nowrap"
                >
                  {createCatMut.isPending ? "Creating..." : "Add"}
                </button>
              </div>
            ) : (
              <select className="input" value={form.category} onChange={set("category")} required>
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea className="input" rows={4} value={form.description} onChange={set("description")} placeholder="Describe your product..." required />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="featured" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} className="w-4 h-4 accent-pink-600" />
            <label htmlFor="featured" className="text-sm text-gray-700">Mark as Featured Product</label>
          </div>
        </div>

        {/* Images */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4"><Upload className="w-4 h-4 text-pink-600" /> Product Images</h2>
          <label className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center cursor-pointer hover:border-pink-300 transition-colors">
            <Upload className="w-8 h-8 text-gray-300 mb-2" />
            <span className="text-sm text-gray-500">Click to upload images</span>
            <input type="file" multiple accept="image/*" onChange={handleImages} className="hidden" />
          </label>
          {form.images.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {form.images.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img} alt="" className="w-20 h-20 rounded-xl object-cover" />
                  <button type="button" onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">×</button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 pt-5 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Video URL <span className="text-gray-400">(optional)</span></label>
            <input
              type="url"
              className="input"
              value={form.videoUrl}
              onChange={set("videoUrl")}
              placeholder="https://example.com/video.mp4 — vertical/shorts format recommended"
            />
            <p className="text-xs text-gray-400 mt-1.5">Add a short vertical video to feature this product in the homepage reels section.</p>
          </div>
        </div>

        {/* Variants */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Variants</h2>
            <button type="button" onClick={addVariant} className="btn-outline text-sm flex items-center gap-1 py-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Variant
            </button>
          </div>

          <div className="space-y-6">
            {form.variants.map((v, vi) => (
              <div key={vi} className="border border-gray-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm text-gray-700">Variant {vi + 1}</p>
                  {form.variants.length > 1 && (
                    <button type="button" onClick={() => removeVariant(vi)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                    <select className="input text-sm" value={v.color} onChange={e => setV(vi, "color", e.target.value)}>
                      <option value="">Select Color</option>
                      {COLORS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">SKU</label>
                    <input className="input text-sm" value={v.sku} onChange={e => setV(vi, "sku", e.target.value)} placeholder="SKU-001" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Selling Price (₹) *</label>
                    <input type="number" className="input text-sm" value={v.price} onChange={e => setV(vi, "price", e.target.value)} placeholder="999" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">MRP (₹)</label>
                    <input type="number" className="input text-sm" value={v.mrp} onChange={e => setV(vi, "mrp", e.target.value)} placeholder="1299" />
                  </div>
                </div>

                {/* Sizes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-600">Sizes & Stock</label>
                    <button type="button" onClick={() => addSize(vi)} className="text-pink-600 text-xs flex items-center gap-0.5 hover:underline">
                      <Plus className="w-3 h-3" /> Add Size
                    </button>
                  </div>
                  {v.sizes.map((s, si) => (
                    <div key={si} className="flex gap-2 mb-2">
                      <select className="input text-sm flex-1" value={s.size} onChange={e => setSize(vi, si, "size", e.target.value)}>
                        <option value="">Size</option>
                        {SIZES.map(sz => <option key={sz}>{sz}</option>)}
                      </select>
                      <input type="number" className="input text-sm w-24" value={s.stock} onChange={e => setSize(vi, si, "stock", e.target.value)} placeholder="Stock" />
                      {v.sizes.length > 1 && (
                        <button type="button" onClick={() => removeSize(vi, si)} className="text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate("/vendor/products")} className="btn-outline flex-1">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
            {mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Submit for Review"}
          </button>
        </div>
      </form>
    </div>
  );
}
