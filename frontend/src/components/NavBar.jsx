import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { BsBox2Heart } from "react-icons/bs";
import { GiSewingNeedle } from "react-icons/gi";
import { FiShoppingCart, FiUser, FiMenu, FiX } from "react-icons/fi";
import { motion } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "./ui/sheet";
import { Separator } from "./ui/separator";
import { ShoppingBag, Phone, LogIn, LogOut, ListOrdered, Store, Bell, MapPin, Wallet, Edit, Headphones, ChevronDown, Truck, Shield, HeartHandshake, Heart } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

function NotificationBell() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/notifications");
      return res.data;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const readAllMut = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () => qc.invalidateQueries(["notifications"]),
  });

  const notifications = data || [];
  const unread = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
        <Bell className="w-[18px] h-[18px] text-gray-700" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-pink-600 text-white text-[9px] rounded-full flex items-center justify-center font-bold ring-2 ring-white">{unread > 9 ? "9+" : unread}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/50">
            <span className="font-semibold text-sm text-gray-900">Notifications</span>
            {unread > 0 && (
              <button onClick={() => readAllMut.mutate()} className="text-xs text-pink-600 hover:underline font-medium">Mark all read</button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No notifications</p>
            ) : (
              notifications.slice(0, 10).map(n => (
                <div key={n._id} className={`px-4 py-3 border-b border-gray-50 ${!n.isRead ? "bg-pink-50/50" : ""}`}>
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function UserDropdown({ user, logout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const menuItems = [
    { icon: ListOrdered, label: "My Orders", href: "/orders" },
    { icon: MapPin, label: "Manage Addresses", href: "/account/addresses" },
    { icon: Wallet, label: "Wallet", href: "/wallet" },
    { icon: Headphones, label: "Support", href: "/support" },
    { icon: Edit, label: "Edit Profile", href: "/account/edit" },
  ];

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
          {user?.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <span className="text-sm font-medium text-gray-700 max-w-[80px] truncate hidden lg:block">{user?.name?.split(" ")[0] || "Account"}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden py-1">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          {menuItems.map((item) => (
            <Link key={item.href} to={item.href} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors">
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
          <div className="border-t border-gray-100 mt-1">
            <button onClick={() => { logout(); setOpen(false); }} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full transition-colors">
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const topBarItems = [
  { icon: Truck, text: "Free Shipping on orders above ₹999" },
  { icon: Shield, text: "100% Secure Payments" },
  { icon: HeartHandshake, text: "Premium Quality Guaranteed" },
];

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout, isVendor, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const { count: wishCount } = useWishlist();
  const location = useLocation();
  const isAuthenticated = !!user;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/readymades", label: "Readymades" },
    { to: "/stitch-service", label: "Stitching Services" },
    { to: "/contact", label: "Contact" },
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div>
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-pink-600 via-pink-500 to-purple-600 text-white hidden sm:block fixed top-0 w-full z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-8 text-[11px] font-medium">
            <div className="flex items-center gap-6">
              {topBarItems.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <item.icon className="w-3 h-3 opacity-80" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <a href="tel:+919361663823" className="flex items-center gap-1 hover:text-white/80 transition-colors">
                <Phone className="w-3 h-3" />
                +91 9361663823
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className={`bg-white w-full fixed top-0 sm:top-8 z-10 transition-all duration-300 ${scrolled ? "shadow-lg" : "shadow-sm border-b border-gray-100"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <img className="h-10 w-auto" src="/logo.png" alt="Yosai" onError={(e) => { e.target.style.display='none'; e.target.parentNode.innerHTML='<span class="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Yōsai</span>'; }} />
            </Link>

            {/* Desktop Nav Links - Centered */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    isActive(link.to)
                      ? "text-pink-600"
                      : "text-gray-600 hover:text-pink-600"
                  }`}
                >
                  {link.label}
                  {isActive(link.to) && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute bottom-0 left-2 right-2 h-[2px] bg-pink-600 rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
              {(!user || (!isVendor && !isAdmin)) && (
                <Link
                  to="/vendor/onboarding"
                  className="px-4 py-2 text-sm font-semibold text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                >
                  Register as Seller
                </Link>
              )}
              {isVendor && <Link to="/vendor/dashboard" className="px-4 py-2 text-sm font-semibold text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">Vendor Panel</Link>}
              {isAdmin && <Link to="/admin/dashboard" className="px-4 py-2 text-sm font-semibold text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">Admin Panel</Link>}
            </div>

            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-1">
              {/* Wishlist */}
              <Link to="/wishlist" className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors" aria-label="Wishlist">
                <Heart className="w-[18px] h-[18px] text-gray-700" />
                {wishCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4.5 h-4.5 min-w-[18px] bg-pink-600 text-white text-[9px] rounded-full flex items-center justify-center font-bold ring-2 ring-white">
                    {wishCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link to="/cart" className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <FiShoppingCart className="w-[18px] h-[18px] text-gray-700" />
                {itemCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4.5 h-4.5 min-w-[18px] bg-pink-600 text-white text-[9px] rounded-full flex items-center justify-center font-bold ring-2 ring-white">
                    {itemCount}
                  </span>
                )}
              </Link>

              <NotificationBell />

              {/* Divider */}
              <div className="w-px h-6 bg-gray-200 mx-1" />

              {isAuthenticated ? (
                <UserDropdown user={user} logout={logout} />
              ) : (
                <Link
                  to="/auth"
                  className="flex items-center gap-2 px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors shadow-sm"
                >
                  <FiUser className="w-4 h-4" />
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Icons */}
            <div className="-mr-2 flex items-center gap-1 sm:hidden">
              {isAuthenticated && (
                <Link to="/orders" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                  <BsBox2Heart className="text-lg text-gray-700" />
                </Link>
              )}
              <Link to="/wishlist" className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors" aria-label="Wishlist">
                <Heart className="w-[18px] h-[18px] text-gray-700" />
                {wishCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-pink-600 text-white text-[8px] rounded-full flex items-center justify-center font-bold ring-2 ring-white">{wishCount}</span>
                )}
              </Link>
              <Link to="/cart" className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <FiShoppingCart className="text-lg text-gray-700" />
                {itemCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-pink-600 text-white text-[8px] rounded-full flex items-center justify-center font-bold ring-2 ring-white">{itemCount}</span>
                )}
              </Link>
              <button onClick={() => setIsOpen(!isOpen)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                {isOpen ? <FiX className="h-5 w-5 text-gray-700" /> : <FiMenu className="h-5 w-5 text-gray-700" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sheet Drawer */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-[85vw] max-w-sm p-0 flex flex-col">
          <SheetHeader className="px-4 pt-4 pb-2 flex-shrink-0">
            <SheetTitle>
              <Link to="/" onClick={() => setIsOpen(false)}>
                <img className="h-10 w-auto" src="/logo.png" alt="Yosai Logo" onError={(e) => { e.target.style.display='none'; }} />
              </Link>
            </SheetTitle>
            <SheetDescription></SheetDescription>
          </SheetHeader>

          {/* User card if logged in */}
          {isAuthenticated && (
            <div className="px-4 pb-2 flex-shrink-0">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          )}

          <Separator className="flex-shrink-0" />

          {/* Scrollable nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
            <Link to="/readymades" className="flex items-center py-2.5 px-2 text-sm font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors" onClick={() => setIsOpen(false)}>
              <ShoppingBag className="mr-3 h-4 w-4" /> Ready Mades
            </Link>
            <Link to="/stitch-service" className="flex items-center py-2.5 px-2 text-sm font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors" onClick={() => setIsOpen(false)}>
              <GiSewingNeedle className="mr-3 h-4 w-4" /> Stitching Services
            </Link>
            <Link to="/contact" className="flex items-center py-2.5 px-2 text-sm font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors" onClick={() => setIsOpen(false)}>
              <Phone className="mr-3 h-4 w-4" /> Contact
            </Link>
            <Link to="/cart" className="flex items-center py-2.5 px-2 text-sm font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors" onClick={() => setIsOpen(false)}>
              <FiShoppingCart className="mr-3 h-4 w-4" /> Cart
              {itemCount > 0 && <span className="ml-auto bg-pink-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">{itemCount}</span>}
            </Link>
            <Link to="/wishlist" className="flex items-center py-2.5 px-2 text-sm font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors" onClick={() => setIsOpen(false)}>
              <Store className="mr-3 h-4 w-4" /> Wishlist
            </Link>

            {isAuthenticated && (
              <>
                <Separator className="my-2" />
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">Your Account</p>
                <Link to="/orders" className="flex items-center py-2.5 px-2 text-sm font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors" onClick={() => setIsOpen(false)}>
                  <ListOrdered className="mr-3 h-4 w-4" /> My Orders
                </Link>
                <Link to="/account/addresses" className="flex items-center py-2.5 px-2 text-sm font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors" onClick={() => setIsOpen(false)}>
                  <MapPin className="mr-3 h-4 w-4" /> Addresses
                </Link>
                <Link to="/wallet" className="flex items-center py-2.5 px-2 text-sm font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors" onClick={() => setIsOpen(false)}>
                  <Wallet className="mr-3 h-4 w-4" /> Wallet
                </Link>
                <Link to="/support" className="flex items-center py-2.5 px-2 text-sm font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors" onClick={() => setIsOpen(false)}>
                  <Headphones className="mr-3 h-4 w-4" /> Support
                </Link>
                <Link to="/account/edit" className="flex items-center py-2.5 px-2 text-sm font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors" onClick={() => setIsOpen(false)}>
                  <Edit className="mr-3 h-4 w-4" /> Edit Profile
                </Link>
              </>
            )}

            {!isAuthenticated && (
              <Link to="/auth" className="flex items-center py-2.5 px-2 text-sm font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-lg transition-colors" onClick={() => setIsOpen(false)}>
                <LogIn className="mr-3 h-4 w-4" /> Login
              </Link>
            )}

            {(isVendor || isAdmin || (isAuthenticated && !isVendor && !isAdmin)) && (
              <>
                <Separator className="my-2" />
                {isAuthenticated && !isVendor && !isAdmin && (
                  <Link to="/vendor/onboarding" className="flex items-center py-2.5 px-2 text-sm font-medium text-pink-500 hover:bg-pink-50 rounded-lg transition-colors" onClick={() => setIsOpen(false)}>
                    <Store className="mr-3 h-4 w-4" /> Register as Seller
                  </Link>
                )}
                {isVendor && (
                  <Link to="/vendor/dashboard" className="flex items-center py-2.5 px-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" onClick={() => setIsOpen(false)}>
                    <Store className="mr-3 h-4 w-4" /> Vendor Panel
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/admin/dashboard" className="flex items-center py-2.5 px-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" onClick={() => setIsOpen(false)}>
                    <Store className="mr-3 h-4 w-4" /> Admin Panel
                  </Link>
                )}
              </>
            )}

            {isAuthenticated && (
              <button onClick={() => { logout(); setIsOpen(false); }} className="flex items-center py-2.5 px-2 w-full text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <LogOut className="mr-3 h-4 w-4" /> Logout
              </button>
            )}
          </nav>

          <SheetFooter className="flex-shrink-0 px-4 py-3 border-t">
            <div className="w-full">
              <Link to="/stitch-service" onClick={() => setIsOpen(false)} className="w-full">
                <motion.p className="w-full text-center px-4 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-sm font-semibold rounded-xl shadow-md cursor-pointer" whileHover={{ scale: 1.02 }}>
                  Book Stitching Service
                </motion.p>
              </Link>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <div className="md:hidden pt-[64px]"></div>
    </div>
  );
}
