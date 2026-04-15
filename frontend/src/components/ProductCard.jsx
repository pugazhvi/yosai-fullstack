import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Eye, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AddToCartTrash from "./AddToCartTrash";
import AddToCartDialog from "./AddToCartDialog";
import { useWishlist } from "@/context/WishlistContext";

export default function ProductCard({ product, viewMode = "grid" }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const navigate = useNavigate();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const liked = isWishlisted(product?._id);

  const price = product?.variants?.[0]?.price || product?.price || 0;
  const mrp = product?.variants?.[0]?.mrp || product?.mrp || 0;
  const discount = mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const rating = product?.rating || 0;
  const reviewCount = product?.reviewCount || 0;

  const handleCardClick = () => navigate(`/viewproduct/${product._id}`);

  /* ===== LIST VIEW ===== */
  if (viewMode === "list") {
    return (
      <>
        <div
          onClick={handleCardClick}
          className="flex bg-white rounded-xl sm:rounded-2xl border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer overflow-hidden"
        >
          <div className="relative w-28 sm:w-36 md:w-44 flex-shrink-0">
            <div className="aspect-[3/4] overflow-hidden bg-gray-50">
              <img src={product?.images?.[0] || "/placeholder.svg"} alt={product?.name} className="w-full h-full object-cover" />
            </div>
            {discount > 0 && (
              <span className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md">{discount}%</span>
            )}
          </div>
          <div className="flex flex-col flex-1 p-3 sm:p-4 md:p-5 min-w-0">
            {product?.category && <span className="text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-widest font-medium mb-0.5 sm:mb-1 truncate">{product.category?.name || product.category}</span>}
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 line-clamp-1">{product?.name}</h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3 line-clamp-2 hidden sm:block">{product?.description}</p>
            <RatingStars rating={rating} count={reviewCount} />
            <div className="flex items-center gap-1.5 sm:gap-2 mt-auto mb-2 sm:mb-3">
              <span className="text-base sm:text-lg font-bold text-gray-900">₹{price.toLocaleString()}</span>
              {mrp > price && <span className="text-xs sm:text-sm text-gray-400 line-through">₹{mrp.toLocaleString()}</span>}
            </div>
            <div onClick={(e) => e.stopPropagation()} className="max-w-xs"><AddToCartTrash product={product} /></div>
          </div>
        </div>
        <AddToCartDialog open={dialogOpen} onOpenChange={setDialogOpen} product={product} />
      </>
    );
  }

  /* ===== GRID VIEW ===== */
  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="h-full"
      >
        <div
          onClick={handleCardClick}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className="group relative bg-white rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer h-full flex flex-col border border-gray-100/80 hover:border-gray-200 hover:shadow-xl transition-all duration-500"
        >
          {/* Image */}
          <div className="relative overflow-hidden">
            <div className="aspect-[3/4] bg-gray-100">
              {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-gray-200" />}
              <img
                src={product?.images?.[0] || "/placeholder.svg"}
                alt={product?.name || "Product"}
                className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                onLoad={() => setImgLoaded(true)}
                loading="lazy"
              />
            </div>

            {/* Hover gradient (desktop) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:block" />

            {/* Discount badge */}
            {discount > 0 && (
              <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-10">
                <span className="bg-rose-500 text-white text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg shadow-lg shadow-rose-500/25">
                  {discount}% OFF
                </span>
              </div>
            )}

            {/* Hover action buttons (desktop only) */}
            <AnimatePresence>
              {isHovering && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-3 right-3 flex-col gap-2 z-10 hidden md:flex"
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
                    className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all"
                  >
                    <Eye className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-gray-700" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
                    className={`w-8 h-8 lg:w-9 lg:h-9 rounded-full backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 transition-all ${liked ? "bg-pink-600 hover:bg-pink-700" : "bg-white/90 hover:bg-white"}`}
                    aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart className={`h-3.5 w-3.5 lg:h-4 lg:w-4 ${liked ? "text-white fill-white" : "text-gray-700"}`} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Add to cart slide up on hover (desktop only) */}
            <AnimatePresence>
              {isHovering && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-0 left-0 right-0 p-2.5 lg:p-3 z-10 hidden md:block"
                  onClick={(e) => e.stopPropagation()}
                >
                  <AddToCartTrash product={product} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Product Info */}
          <div className="flex flex-col flex-1 p-2.5 sm:p-3 md:p-4">
            {product?.category && (
              <span className="text-[9px] sm:text-[10px] md:text-[11px] text-gray-400 uppercase tracking-wider sm:tracking-widest font-medium mb-0.5 truncate">
                {product.category?.name || product.category}
              </span>
            )}
            <h3 className="font-semibold text-gray-900 text-[13px] sm:text-sm md:text-[15px] leading-snug line-clamp-1 mb-1 sm:mb-1.5 group-hover:text-pink-600 transition-colors">
              {product?.name || "Product Name"}
            </h3>

            <RatingStars rating={rating} count={reviewCount} />

            {/* Price */}
            <div className="flex items-baseline gap-1.5 sm:gap-2 mt-auto pt-0.5 sm:pt-1">
              <span className="text-sm sm:text-base md:text-lg font-bold text-gray-900">₹{price.toLocaleString()}</span>
              {mrp > price && (
                <span className="text-[10px] sm:text-xs md:text-sm text-gray-400 line-through">₹{mrp.toLocaleString()}</span>
              )}
            </div>

            {/* Mobile Add to Cart (always visible) */}
            <div className="mt-2 sm:mt-2.5 md:hidden" onClick={(e) => e.stopPropagation()}>
              <AddToCartTrash product={product} />
            </div>
          </div>
        </div>
      </motion.div>
      <AddToCartDialog open={dialogOpen} onOpenChange={setDialogOpen} product={product} />
    </>
  );
}

function RatingStars({ rating, count }) {
  if (!rating && !count) return null;
  return (
    <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
      <div className="flex items-center gap-0.5 bg-green-50 px-1 sm:px-1.5 py-0.5 rounded">
        <span className="text-[10px] sm:text-xs font-bold text-green-700">{rating.toFixed(1)}</span>
        <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600 fill-green-600" />
      </div>
      {count > 0 && <span className="text-[10px] sm:text-[11px] text-gray-400">({count})</span>}
    </div>
  );
}
