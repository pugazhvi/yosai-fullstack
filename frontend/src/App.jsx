import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

// Layouts
import CustomerLayout from "@/layouts/CustomerLayout";
import VendorLayout from "@/layouts/VendorLayout";
import AdminLayout from "@/layouts/AdminLayout";

// Customer Pages
import Home from "@/pages/customer/Home";
import Products from "@/pages/customer/Products";
import ProductDetail from "@/pages/customer/ProductDetail";
import Cart from "@/pages/customer/Cart";
import Wishlist from "@/pages/customer/Wishlist";
import Checkout from "@/pages/customer/Checkout";
import Orders from "@/pages/customer/Orders";
import OrderDetail from "@/pages/customer/OrderDetail";
import CustomerWallet from "@/pages/customer/Wallet";
import Account from "@/pages/customer/Account";
import Contact from "@/pages/customer/Contact";
import StitchService from "@/pages/customer/StitchService";
import ServiceBooking from "@/pages/customer/ServiceBooking";
import ManageAddress from "@/pages/customer/ManageAddress";
import EditProfile from "@/pages/customer/EditProfile";
import CustomerSupport from "@/pages/customer/Support";

// Policy Pages
import PrivacyPolicy from "@/pages/customer/PrivacyPolicy";
import TermsAndConditions from "@/pages/customer/TermsAndConditions";
import RefundPolicy from "@/pages/customer/RefundPolicy";
import ReturnPolicy from "@/pages/customer/ReturnPolicy";
import ShippingPolicy from "@/pages/customer/ShippingPolicy";

// Auth
import Auth from "@/pages/Auth";

// Vendor Pages
import VendorOnboarding from "@/pages/vendor/Onboarding";
import VendorPending from "@/pages/vendor/Pending";
import VendorDashboard from "@/pages/vendor/Dashboard";
import VendorProducts from "@/pages/vendor/Products";
import AddProduct from "@/pages/vendor/AddProduct";
import VendorOrders from "@/pages/vendor/Orders";
import VendorWallet from "@/pages/vendor/Wallet";
import VendorAnalytics from "@/pages/vendor/Analytics";
import VendorBankDetails from "@/pages/vendor/BankDetails";
import VendorSupport from "@/pages/vendor/Support";
import VendorSettings from "@/pages/vendor/Settings";
import VendorDocuments from "@/pages/vendor/Documents";
import VendorCoupons from "@/pages/vendor/Coupons";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminVendors from "@/pages/admin/Vendors";
import VendorDetail from "@/pages/admin/VendorDetail";
import AdminProducts from "@/pages/admin/Products";
import AdminCategories from "@/pages/admin/Categories";
import AdminInventory from "@/pages/admin/Inventory";
import AdminInquiries from "@/pages/admin/Inquiries";
import AdminDocumentReview from "@/pages/admin/DocumentReview";
import AdminOrders from "@/pages/admin/Orders";
import AdminCommissions from "@/pages/admin/Commissions";
import AdminPayouts from "@/pages/admin/Payouts";
import AdminUsers from "@/pages/admin/Users";
import AdminSupportTickets from "@/pages/admin/SupportTickets";
import AdminCoupons from "@/pages/admin/Coupons";
import AdminDocuments from "@/pages/admin/Documents";

const getRoleDashboard = (role) => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "vendor") return "/vendor/dashboard";
  return "/";
};

const ProtectedRoute = ({ children, role, customerOnly }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (role && user.role !== role) return <Navigate to={getRoleDashboard(user.role)} replace />;
  if (customerOnly && user.role !== "customer") return <Navigate to={getRoleDashboard(user.role)} replace />;
  return children;
};

export default function App() {
  return (
    <Routes>
      {/* Public Customer Routes */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/readymades" element={<Products />} />
        <Route path="/viewproduct/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/checkout" element={<ProtectedRoute customerOnly><Checkout /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute customerOnly><Orders /></ProtectedRoute>} />
        <Route path="/orders/:orderId" element={<ProtectedRoute customerOnly><OrderDetail /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute customerOnly><CustomerWallet /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute customerOnly><Account /></ProtectedRoute>} />
        <Route path="/account/addresses" element={<ProtectedRoute customerOnly><ManageAddress /></ProtectedRoute>} />
        <Route path="/account/edit" element={<ProtectedRoute customerOnly><EditProfile /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute customerOnly><CustomerSupport /></ProtectedRoute>} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/stitch-service" element={<StitchService />} />
        <Route path="/service-booking" element={<ProtectedRoute><ServiceBooking /></ProtectedRoute>} />

        {/* Policy Pages */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/return-policy" element={<ReturnPolicy />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />

        {/* Legacy redirects */}
        <Route path="/products" element={<Navigate to="/readymades" replace />} />
        <Route path="/products/:id" element={<Navigate to="/readymades" replace />} />
      </Route>

      {/* Auth */}
      <Route path="/auth" element={<Auth />} />
      <Route path="/vendor/onboarding" element={<VendorOnboarding />} />
      <Route path="/vendor/pending" element={<VendorPending />} />

      {/* Vendor Panel */}
      <Route path="/vendor" element={<ProtectedRoute role="vendor"><VendorLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/vendor/dashboard" replace />} />
        <Route path="dashboard" element={<VendorDashboard />} />
        <Route path="products" element={<VendorProducts />} />
        <Route path="products/add" element={<AddProduct />} />
        <Route path="products/edit/:id" element={<AddProduct />} />
        <Route path="orders" element={<VendorOrders />} />
        <Route path="wallet" element={<VendorWallet />} />
        <Route path="analytics" element={<VendorAnalytics />} />
        <Route path="bank-details" element={<VendorBankDetails />} />
        <Route path="coupons" element={<VendorCoupons />} />
        <Route path="documents" element={<VendorDocuments />} />
        <Route path="support" element={<VendorSupport />} />
        <Route path="settings" element={<VendorSettings />} />
      </Route>

      {/* Admin Panel */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="vendors" element={<AdminVendors />} />
        <Route path="vendors/:id" element={<VendorDetail />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="inquiries" element={<AdminInquiries />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="commissions" element={<AdminCommissions />} />
        <Route path="payouts" element={<AdminPayouts />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="support" element={<AdminSupportTickets />} />
        <Route path="documents" element={<AdminDocuments />} />
        <Route path="document-review" element={<AdminDocumentReview />} />
      </Route>
    </Routes>
  );
}
