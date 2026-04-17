import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { Star, Truck, RefreshCw, Shield, ChevronRight, Share2, Heart, Package, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProductImageGallery from "@/components/ProductImageGallery";
import SizeComp from "@/components/SizeComp";
import RelatedProducts from "@/components/RelatedProducts";
import ProductReviews from "@/components/ProductReviews";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("description");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, allProductsRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get("/products"),
        ]);
        setProduct(productRes.data || productRes);
        setProducts(Array.isArray(allProductsRes) ? allProductsRes : allProductsRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto py-8 px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="lg:w-[55%]">
              <div className="aspect-square skeleton rounded-2xl" />
              <div className="flex gap-3 mt-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="w-20 h-20 skeleton rounded-xl" />)}
              </div>
            </div>
            <div className="lg:w-[45%] space-y-4 pt-2">
              <div className="h-5 skeleton rounded w-1/4" />
              <div className="h-9 skeleton rounded w-3/4" />
              <div className="h-5 skeleton rounded w-1/3" />
              <div className="h-12 skeleton rounded w-1/2 mt-4" />
              <div className="h-px bg-gray-100 my-6" />
              <div className="h-40 skeleton rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center p-10 max-w-md bg-white rounded-3xl shadow-lg">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-500 mb-6">The product you're looking for is no longer available.</p>
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
            Back to Store
          </Link>
        </motion.div>
      </div>
    );
  }

  const firstVariant = product.variants?.[0];
  const price = firstVariant?.price || product.price || 0;
  const mrp = firstVariant?.mrp || product.mrp || 0;
  const totalStock = product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ?? product.stockQuantity ?? 0;
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const avgRating = product.rating?.toFixed(1) || "0.0";
  const totalRatings = product.reviewCount || 0;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const tabs = [
    { key: "description", label: "Description" },
    { key: "details", label: "Details" },
    { key: "reviews", label: `Reviews (${totalRatings})` },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50/80 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3">
          <div className="flex items-center text-sm text-gray-400 gap-1.5">
            <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/readymades" className="hover:text-gray-900 transition-colors">Shop</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-700 font-medium truncate max-w-[250px]">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* Left: Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:w-[55%]"
          >
            <ProductImageGallery images={product.images || []} productName={product.name} />
          </motion.div>

          {/* Right: Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:w-[45%]"
          >
            <div className="lg:sticky lg:top-8 space-y-5">
              {/* Category & Actions */}
              <div className="flex items-center justify-between">
                {product?.category && (
                  <span className="text-xs uppercase tracking-widest text-gray-400 font-medium">
                    {product.category?.name || product.category}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <button onClick={handleShare} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-all">
                    <Share2 className="w-4 h-4 text-gray-500" />
                  </button>
                  <button className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-pink-50 hover:border-pink-200 transition-all">
                    <Heart className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>

              {/* Rating + Stock */}
              <div className="flex items-center gap-3 flex-wrap">
                {totalRatings > 0 && (
                  <div className="flex items-center gap-1.5 bg-green-50 px-2.5 py-1 rounded-lg">
                    <span className="text-sm font-bold text-green-700">{avgRating}</span>
                    <Star className="h-3.5 w-3.5 text-green-600 fill-green-600" />
                    <span className="text-xs text-green-600 ml-0.5">({totalRatings})</span>
                  </div>
                )}
                {totalStock > 0 ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" /> In Stock
                  </span>
                ) : (
                  <span className="text-xs text-red-500 font-medium">Out of Stock</span>
                )}
              </div>

              {/* Price Block */}
              <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-5 border border-gray-100">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl md:text-4xl font-bold text-gray-900">₹{price.toLocaleString()}</span>
                  {mrp > price && (
                    <span className="text-lg text-gray-400 line-through">₹{mrp.toLocaleString()}</span>
                  )}
                </div>
                {discount > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">{discount}% OFF</span>
                    <span className="text-sm text-green-600 font-medium">You save ₹{(mrp - price).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-100" />

              {/* Size + Add to Cart */}
              <SizeComp product={product} />

              {/* Delivery Info Cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Truck, title: "Free Delivery", sub: "3-5 days" },
                  { icon: RefreshCw, title: "Easy Returns", sub: "10 days" },
                  { icon: Shield, title: "Secure Pay", sub: "100% safe" },
                ].map(({ icon: Icon, title, sub }, i) => (
                  <div key={i} className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-pink-200 hover:bg-pink-50/30 transition-all">
                    <div className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center mb-2">
                      <Icon className="h-4 w-4 text-pink-600" />
                    </div>
                    <span className="text-xs font-semibold text-gray-900">{title}</span>
                    <span className="text-[10px] text-gray-400">{sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-14 lg:mt-20"
        >
          {/* Tab Headers */}
          <div className="flex gap-1 border-b border-gray-100">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-5 py-3 text-sm font-medium transition-colors ${activeTab === tab.key ? "text-gray-900" : "text-gray-400 hover:text-gray-600"}`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="py-8"
            >
              {activeTab === "description" && (
                <div className="max-w-3xl">
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{product.description || "No description available."}</p>
                </div>
              )}

              {activeTab === "details" && (
                <div className="max-w-2xl">
                  <div className="space-y-0">
                    {[
                      { label: "Category", value: product.category?.name || product.category },
                      { label: "Brand", value: product.brand },
                      { label: "Material", value: product.material },
                      { label: "Available Sizes", value: product.sizes?.join(", ") },
                      { label: "Available Colors", value: product.variants?.map(v => v.color).filter(Boolean).join(", ") },
                    ].filter(d => d.value).map((detail, i) => (
                      <div key={i} className={`flex py-3 ${i > 0 ? "border-t border-gray-50" : ""}`}>
                        <span className="w-40 text-sm text-gray-400 flex-shrink-0">{detail.label}</span>
                        <span className="text-sm text-gray-900 font-medium">{detail.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "reviews" && (
                <ProductReviews productId={product._id} />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Related Products */}
        <div className="mt-8 border-t border-gray-100 pt-10">
          <RelatedProducts products={products} selectedProduct={product} />
        </div>
      </div>
    </div>
  );
}
