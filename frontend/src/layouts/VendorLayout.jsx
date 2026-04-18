import { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, Link, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { notificationRoute } from "@/lib/notificationRoute";
import {
  LayoutDashboard, Package, ShoppingBag, Wallet, BarChart3, Landmark,
  Tag, FileText, Headphones, LogOut, Store, Bell, Home, Menu, X, Settings,
} from "lucide-react";

const navItems = [
  { to: "/vendor/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/vendor/products", icon: Package, label: "Products" },
  { to: "/vendor/orders", icon: ShoppingBag, label: "Orders" },
  { to: "/vendor/wallet", icon: Wallet, label: "Wallet" },
  { to: "/vendor/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/vendor/bank-details", icon: Landmark, label: "Bank Details" },
  { to: "/vendor/coupons", icon: Tag, label: "Coupons" },
  { to: "/vendor/documents", icon: FileText, label: "Documents" },
  { to: "/vendor/support", icon: Headphones, label: "Support" },
  { to: "/vendor/settings", icon: Settings, label: "Settings" },
];

function NotificationBell() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => { const res = await api.get("/notifications"); return res.data; },
    refetchInterval: 30000,
  });

  const readAllMut = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const readOneMut = useMutation({
    mutationFn: (id) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const notifications = data || [];
  const unread = notifications.filter(n => !n.isRead).length;

  const handleClick = (n) => {
    const target = notificationRoute(n, "vendor");
    if (!n.isRead) readOneMut.mutate(n._id);
    setOpen(false);
    if (target) navigate(target);
  };

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
        <Bell className="w-5 h-5 text-gray-600" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{unread > 9 ? "9+" : unread}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-semibold text-sm text-gray-900">Notifications</span>
            {unread > 0 && <button onClick={() => readAllMut.mutate()} className="text-xs text-pink-600 hover:underline">Mark all read</button>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No notifications</p>
            ) : notifications.slice(0, 10).map(n => (
              <button
                key={n._id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.isRead ? "bg-pink-50 hover:bg-pink-100" : ""}`}
              >
                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VendorLayout() {
  const { user, vendor, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect non-approved vendors to pending page
  if (vendor && vendor.status !== "approved") {
    return <Navigate to="/vendor/pending" replace />;
  }

  const currentPage = navItems.find(item => location.pathname.startsWith(item.to))?.label || "Dashboard";

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`w-64 bg-white border-r border-gray-100 fixed h-full flex flex-col z-50 transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl brand-gradient flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 truncate max-w-[130px]">{vendor?.brandName || "My Store"}</p>
              <p className="text-xs text-gray-500 capitalize">{vendor?.status || "pending"}</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden p-1 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? "brand-gradient text-white shadow-md" : "text-gray-600 hover:bg-pink-50 hover:text-pink-600"}`}>
              <Icon className="w-4 h-4" />{label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl bg-gray-50">
            <div className="w-7 h-7 rounded-full brand-gradient flex items-center justify-center text-white text-xs font-bold">{user?.name?.charAt(0)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl">
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{currentPage}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/" className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
                <Home className="w-4 h-4" /> Visit Store
              </Link>
              <NotificationBell />
              <div className="flex items-center gap-2 pl-3 ml-2 border-l border-gray-100">
                <div className="w-8 h-8 rounded-full brand-gradient flex items-center justify-center text-white text-xs font-bold">{user?.name?.charAt(0)}</div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 leading-tight">{user?.name}</p>
                  <p className="text-xs text-gray-500">{vendor?.brandName || "Vendor"}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
