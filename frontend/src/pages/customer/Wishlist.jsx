import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";

export default function Wishlist() {
  const { items, toggleWishlist } = useWishlist();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center min-h-[60vh]">
        <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mb-6">
          <Heart className="h-10 w-10 text-pink-500" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Sign in to see your wishlist</h2>
        <p className="text-gray-500 mb-6 max-w-md">Save your favorite items and come back to them anytime.</p>
        <Link to="/auth" className="px-6 py-3 bg-pink-600 text-white rounded-full font-medium hover:bg-pink-700 transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center min-h-[60vh]">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Heart className="h-12 w-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
        <p className="text-gray-500 mb-6 max-w-md">Tap the heart on products you love to save them here.</p>
        <Link to="/readymades" className="inline-flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-full font-medium hover:bg-pink-700 transition-colors">
          <ShoppingBag className="h-4 w-4" /> Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500 fill-pink-500" /> My Wishlist
          </h1>
          <p className="text-gray-500 text-sm mt-1">{items.length} item{items.length !== 1 ? "s" : ""} saved</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        {items.map((p, i) => {
          const price = p.variants?.[0]?.price || 0;
          const mrp = p.variants?.[0]?.mrp || 0;
          const discount = mrp && price ? Math.round(((mrp - price) / mrp) * 100) : 0;
          return (
            <motion.div
              key={p._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all"
            >
              <Link to={`/viewproduct/${p._id}`} className="block">
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                  <img
                    src={p.images?.[0] || "/placeholder.jpg"}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {discount > 0 && (
                    <span className="absolute top-2 left-2 bg-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {discount}% OFF
                    </span>
                  )}
                </div>
                <div className="p-3">
                  {p.category?.name && (
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">{p.category.name}</p>
                  )}
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mt-0.5">{p.name}</h3>
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <span className="text-sm font-bold text-gray-900">₹{price.toLocaleString()}</span>
                    {mrp > price && <span className="text-xs text-gray-400 line-through">₹{mrp.toLocaleString()}</span>}
                  </div>
                </div>
              </Link>
              <button
                onClick={() => toggleWishlist(p)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow hover:bg-red-50 hover:text-red-500 transition-colors"
                aria-label="Remove from wishlist"
              >
                <Trash2 className="w-3.5 h-3.5 text-gray-600 hover:text-red-500" />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
