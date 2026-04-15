import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Minus, Plus, ShoppingCart, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";

const AddToCart = ({ product, className = "", fillclassName = "", size = {} }) => {
  const { cart, isSizeInCart, getQuantity, addToCart, updateQuantity, removeItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localQty, setLocalQty] = useState(1);
  const [error, setError] = useState("");

  const { _id: productId } = product;
  const selectedSize = size[productId] || "";
  const isInCart = isSizeInCart(productId, selectedSize);
  const cartQuantity = getQuantity(productId, selectedSize);

  const displayQty = isInCart ? cartQuantity : localQty;

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(""), 6000);
  };

  const findItemId = () =>
    cart.items?.find((it) => {
      const pid = it.productId?._id || it.productId;
      return pid === productId && (!selectedSize || it.selectedSize === selectedSize);
    })?._id;

  const handleAddToCart = async () => {
    if (!selectedSize && product.sizes && product.sizes.length > 0) {
      showError("Please select a size first");
      return;
    }
    setIsAdding(true);
    try {
      await addToCart(productId, selectedSize, localQty);
    } catch {
      showError("Error adding to cart");
    } finally {
      setIsAdding(false);
    }
  };

  const handleIncrease = async () => {
    if (product.stockQuantity && displayQty >= product.stockQuantity) {
      showError("Out of stock");
      return;
    }
    if (isInCart) {
      const itemId = findItemId();
      if (!itemId) return;
      setBusy(true);
      try { await updateQuantity(itemId, displayQty + 1); } catch { showError("Error updating"); } finally { setBusy(false); }
    } else {
      setLocalQty((q) => q + 1);
    }
  };

  const handleDecrease = async () => {
    if (displayQty <= 1) {
      if (isInCart) {
        await handleRemoveFromCart();
      } else {
        showError("Quantity cannot be less than 1");
      }
      return;
    }
    if (isInCart) {
      const itemId = findItemId();
      if (!itemId) return;
      setBusy(true);
      try { await updateQuantity(itemId, displayQty - 1); } catch { showError("Error updating"); } finally { setBusy(false); }
    } else {
      setLocalQty((q) => Math.max(q - 1, 1));
    }
  };

  const handleRemoveFromCart = async () => {
    const itemId = findItemId();
    if (!itemId) return;
    setIsRemoving(true);
    try { await removeItem(itemId); } catch { showError("Error removing item"); } finally { setIsRemoving(false); }
  };

  return (
    <div className="w-full">
      <div className={cn("flex gap-4 items-center mt-8", className)}>
        {isInCart ? (
          <div className="flex w-full items-center justify-between sm:justify-start sm:space-x-6">
            <div className="flex items-center space-x-6">
              <Button onClick={handleDecrease} disabled={busy} variant="outline" size="icon" className="h-10 w-10 rounded-full border-pink-200 text-pink-600 hover:bg-pink-50 disabled:opacity-50">
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold min-w-[24px] text-center">{busy ? "..." : displayQty}</span>
              <Button onClick={handleIncrease} disabled={busy} variant="outline" size="icon" className="h-10 w-10 rounded-full border-pink-200 text-pink-600 hover:bg-pink-50 disabled:opacity-50">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button disabled={isRemoving} onClick={handleRemoveFromCart} className="bg-red-600 text-white rounded-lg hover:bg-red-700 ml-4">
              {isRemoving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        ) : (
          <div className="flex w-full items-center justify-between sm:justify-start sm:space-x-6">
            <div className="flex items-center space-x-6">
              <Button onClick={handleDecrease} variant="outline" size="icon" className="h-10 w-10 rounded-full border-pink-200 text-pink-600 hover:bg-pink-50">
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold">{displayQty}</span>
              <Button onClick={handleIncrease} variant="outline" size="icon" className="h-10 w-10 rounded-full border-pink-200 text-pink-600 hover:bg-pink-50">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={handleAddToCart} disabled={isAdding} className="bg-pink-600 w-full text-white py-2 px-4 rounded-lg hover:bg-pink-700 ml-4">
              {isAdding ? <><div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Adding...</> : <><ShoppingCart className="mr-2 h-4 w-4" />Add to Cart</>}
            </Button>
          </div>
        )}
      </div>
      {isInCart && (
        <Link to="/cart" className="flex justify-center mt-4 flex-1">
          <Button className={cn("flex w-full bg-pink-600 hover:bg-pink-700", fillclassName)}>
            <ShoppingBag className="mr-2 h-4 w-4" />
            Go to Cart {cartQuantity > 0 && `(${cartQuantity})`}
          </Button>
        </Link>
      )}
      {error && <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
    </div>
  );
};

export default AddToCart;
