import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, User, Phone,
  Building2, Upload, ChevronRight, ChevronLeft, FileText, X, Loader2, Check,
} from "lucide-react";

// Convert File to base64 string
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// Upload a base64 file to backend → Cloudinary
const uploadFile = async (base64, folder) => {
  const res = await api.post("/upload", { file: base64, folder });
  return res.data?.url || res.url;
};

export default function VendorOnboarding() {
  const { user, login, register, fetchMe, isVendor } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Default to signup since this is the seller registration page
  const [activeTab, setActiveTab] = useState(searchParams.get("signin") ? "signin" : "signup");
  const isSignup = activeTab === "signup";

  const [authForm, setAuthForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    doorNo: "", street: "", city: "", pincode: "", state: "", country: "India",
    brandName: "", category: "Seller", description: "", gstNumber: "",
    panNumber: "", accountHolderName: "", accountNumber: "", ifscCode: "", bankName: "",
  });

  // Logo
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // Documents: array of { file, preview, label, uploading }
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isVendor) navigate("/vendor/dashboard", { replace: true });
  }, [isVendor]);

  useEffect(() => {
    if (user && !isVendor && step === 0) setStep(1);
  }, [user]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setAuth = (key) => (e) => setAuthForm((f) => ({ ...f, [key]: e.target.value }));

  const handleTabChange = (value) => {
    setActiveTab(value);
    setError("");
    setSuccess("");
  };

  // --- Logo ---
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { setError("Logo must be under 5MB"); return; }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // --- Documents ---
  const handleDocAdd = (e) => {
    const files = Array.from(e.target.files || []);
    const newDocs = files.map((f) => ({
      file: f,
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
      label: f.name.replace(/\.[^.]+$/, ""),
      name: f.name,
    }));
    setDocuments((prev) => [...prev, ...newDocs]);
    e.target.value = "";
  };

  const removeDoc = (idx) => {
    setDocuments((prev) => prev.filter((_, i) => i !== idx));
  };

  // --- Auth Submit ---
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (isSignup) {
        if (!authForm.name || !authForm.email || !authForm.phone || !authForm.password) {
          setError("Please fill all fields"); setLoading(false); return;
        }
        if (authForm.password.length < 8) {
          setError("Password must be at least 8 characters long"); setLoading(false); return;
        }
        await register({ name: authForm.name, email: authForm.email, phone: authForm.phone, password: authForm.password });
        setSuccess("Account created! Continue to set up your seller profile.");
        setStep(1);
      } else {
        if (!authForm.email || !authForm.password) {
          setError("Please fill all fields"); setLoading(false); return;
        }
        const res = await login(authForm.email, authForm.password);
        if (res.user?.role === "vendor") { navigate("/vendor/dashboard", { replace: true }); return; }
        setSuccess("Signed in! Continue to set up your seller profile.");
        setStep(1);
      }
    } catch (err) {
      setError(err?.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- Validation ---
  const validateStep = () => {
    if (step === 1) {
      if (!form.street || !form.city || !form.state || !form.pincode) {
        setError("Please fill all required address fields"); return false;
      }
    }
    if (step === 2) {
      if (!form.brandName) { setError("Business name is required"); return false; }
    }
    setError("");
    return true;
  };

  const nextStep = () => { if (validateStep()) setStep((s) => s + 1); };
  const prevStep = () => { setError(""); setStep((s) => s - 1); };

  // --- Final Submit ---
  const handleSubmit = async () => {
    if (!form.accountHolderName || !form.accountNumber || !form.ifscCode) {
      setError("Please fill all required bank details"); return;
    }
    setLoading(true);
    setError("");
    try {
      // Upload logo if present
      let logoUrl = null;
      if (logoFile) {
        toast.loading("Uploading logo...", { id: "upload" });
        const base64 = await fileToBase64(logoFile);
        logoUrl = await uploadFile(base64, "vendor-logos");
      }

      // Upload documents
      const uploadedDocs = [];
      for (let i = 0; i < documents.length; i++) {
        toast.loading(`Uploading document ${i + 1}/${documents.length}...`, { id: "upload" });
        const base64 = await fileToBase64(documents[i].file);
        const url = await uploadFile(base64, "vendor-documents");
        uploadedDocs.push({ label: documents[i].label, url, status: "pending" });
      }
      toast.dismiss("upload");

      const payload = {
        brandName: form.brandName,
        phone: user?.phone || authForm.phone,
        description: form.description,
        category: form.category,
        logo: logoUrl,
        address: {
          street: [form.doorNo, form.street].filter(Boolean).join(", "),
          city: form.city, state: form.state, pincode: form.pincode, country: form.country,
        },
        kyc: {
          gstNumber: form.gstNumber,
          panNumber: form.panNumber,
          accountHolderName: form.accountHolderName,
          accountNumber: form.accountNumber,
          ifscCode: form.ifscCode,
          bankName: form.bankName,
          documents: uploadedDocs,
        },
      };

      await api.post("/vendors/register", payload);
      await fetchMe();
      toast.success("Application submitted successfully!");
      navigate("/vendor/pending");
    } catch (err) {
      toast.dismiss("upload");
      setError(err?.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 relative overflow-hidden flex items-center justify-center px-4 py-8">
      {/* Decorative orbs */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-pink-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-20 w-[28rem] h-[28rem] bg-purple-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full space-y-4"
        >
          {/* Header */}
          <div className="text-center">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }} className="mx-auto flex justify-center">
              <img className="h-12 w-auto" src="/logo.png" alt="Yosai" onError={(e) => { e.target.style.display = "none"; }} />
            </motion.div>
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-[10px] font-bold uppercase tracking-wider">
              <Building2 className="w-3 h-3" /> Seller Portal
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2 tracking-tight">
              {isSignup ? "Become a Seller" : "Welcome Back, Seller"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {isSignup ? "Set up your store in minutes — zero fees, free forever" : "Sign in to continue your seller registration"}
            </p>

            {/* Customer redirect banner */}
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-xs text-gray-600 shadow-sm">
              <span>Just want to shop?</span>
              <button
                type="button"
                onClick={() => navigate("/auth")}
                className="font-semibold text-pink-600 hover:text-pink-700 hover:underline"
              >
                Customer Sign In →
              </button>
            </div>
          </div>

        <Card className="border-0 shadow-2xl shadow-pink-500/10 bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
          {/* Progress Stepper — only on signup flow */}
          {isSignup && (
            <div className="px-8 pt-6 pb-2">
              <div className="flex items-center justify-between mb-2">
                {["Account", "Store", "Bank & KYC", "Review"].map((label, i) => {
                  const current = step === i;
                  const done = step > i;
                  return (
                    <div key={i} className="flex-1 flex items-center">
                      <div className="flex flex-col items-center flex-1">
                        <motion.div
                          animate={{ scale: current ? 1.1 : 1 }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                            done ? "bg-green-500 text-white" : current ? "bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/40" : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {done ? <Check className="w-4 h-4" /> : i + 1}
                        </motion.div>
                        <span className={`mt-1.5 text-[10px] font-medium hidden sm:block ${current ? "text-pink-600" : done ? "text-green-600" : "text-gray-400"}`}>{label}</span>
                      </div>
                      {i < 3 && <div className={`h-0.5 flex-1 -mt-5 transition-colors ${done ? "bg-green-500" : "bg-gray-200"}`} />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 0: Auth */}
          {step === 0 && (
            <>
              <CardHeader className="pb-2 px-6 sm:px-8">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-100/80 rounded-xl p-1 h-11">
                    <TabsTrigger value="signin" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Sign In</TabsTrigger>
                    <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="pt-6 px-6 sm:px-8 pb-8">
                <form onSubmit={handleAuthSubmit} className="space-y-5">
                  <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, x: isSignup ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-5">
                      {isSignup && (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label htmlFor="name" className="flex items-center gap-1.5 text-xs"><User className="h-3.5 w-3.5 text-gray-400" /> Full Name</Label>
                              <Input id="name" placeholder="John Doe" value={authForm.name} onChange={setAuth("name")} required />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="email" className="flex items-center gap-1.5 text-xs"><Mail className="h-3.5 w-3.5 text-gray-400" /> Email Address</Label>
                              <Input id="email" type="email" placeholder="your@email.com" value={authForm.email} onChange={setAuth("email")} required />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="phone" className="flex items-center gap-1.5 text-xs"><Phone className="h-3.5 w-3.5 text-gray-400" /> Phone Number</Label>
                              <Input id="phone" placeholder="+91 9876543210" value={authForm.phone} onChange={setAuth("phone")} required />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="password" className="flex items-center gap-1.5 text-xs"><Lock className="h-3.5 w-3.5 text-gray-400" /> Password</Label>
                              <div className="relative">
                                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={authForm.password} onChange={setAuth("password")} required />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      {!isSignup && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="login-email">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                              <Input id="login-email" type="email" placeholder="name@example.com" className="pl-10" value={authForm.email} onChange={setAuth("email")} required />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="login-password">Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                              <Input id="login-password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10" value={authForm.password} onChange={setAuth("password")} required />
                              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  <AlertBlock error={error} success={success} />

                  <Button type="submit" className="w-full h-12 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 shadow-lg shadow-pink-500/30 text-base font-semibold rounded-xl transition-all hover:scale-[1.01]" disabled={loading}>
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                    ) : isSignup ? (
                      <>Continue to Store Setup <ChevronRight className="ml-1 h-4 w-4" /></>
                    ) : (
                      "Sign In & Continue"
                    )}
                  </Button>

                  {isSignup && (
                    <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> No setup fees</span>
                      <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Secure signup</span>
                      <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Free forever</span>
                    </div>
                  )}
                </form>
              </CardContent>
              <CardFooter className="flex justify-center border-t pt-4">
                <p className="text-sm text-gray-600">
                  {isSignup ? "Already have an account? " : "Don't have an account? "}
                  <button type="button" onClick={() => handleTabChange(isSignup ? "signin" : "signup")} className="font-medium text-pink-600 hover:text-pink-500">
                    {isSignup ? "Sign in" : "Sign Up"}
                  </button>
                </p>
              </CardFooter>
            </>
          )}

          {/* Steps 1-3 */}
          {step >= 1 && step <= 3 && (
            <>
              <CardHeader className="pb-2">
                <Tabs value="signup" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin" disabled>Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="pt-4">
                <AnimatePresence mode="wait">
                  <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }} className="space-y-4">

                    {/* Step 1: Address */}
                    {step === 1 && (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">Personal Address</h3>
                          <span className="text-xs text-gray-400">Step 2 of 4</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>Door/Flat No.</Label><Input placeholder="Apt 123" value={form.doorNo} onChange={set("doorNo")} /></div>
                          <div className="space-y-2"><Label>Street *</Label><Input placeholder="123 Main St" value={form.street} onChange={set("street")} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>City *</Label><Input placeholder="Mumbai" value={form.city} onChange={set("city")} /></div>
                          <div className="space-y-2"><Label>Postal Code *</Label><Input placeholder="400001" value={form.pincode} onChange={set("pincode")} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>State *</Label><Input placeholder="Maharashtra" value={form.state} onChange={set("state")} /></div>
                          <div className="space-y-2"><Label>Country</Label><Input placeholder="India" value={form.country} onChange={set("country")} /></div>
                        </div>
                      </>
                    )}

                    {/* Step 2: Business Info + Logo */}
                    {step === 2 && (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">Business Information</h3>
                          <span className="text-xs text-gray-400">Step 3 of 4</span>
                        </div>
                        {/* Logo Upload */}
                        <div className="flex justify-center">
                          <label className="cursor-pointer group">
                            <div className="w-28 h-28 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-pink-400 hover:bg-pink-50/50 transition-colors overflow-hidden relative">
                              {logoPreview ? (
                                <>
                                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                  <button type="button" onClick={(e) => { e.preventDefault(); setLogoFile(null); setLogoPreview(null); }}
                                    className="absolute top-1 right-1 bg-white/80 rounded-full p-0.5 hover:bg-red-100">
                                    <X className="h-3.5 w-3.5 text-red-500" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Upload className="h-6 w-6 text-gray-400 group-hover:text-pink-500" />
                                  <span className="text-xs text-gray-400 mt-1 text-center leading-tight">Upload<br />Business Logo</span>
                                </>
                              )}
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                          </label>
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-gray-400" /> Business Name *</Label>
                          <Input placeholder="Your Store Name" value={form.brandName} onChange={set("brandName")} />
                        </div>
                        <div className="space-y-2">
                          <Label>Business Category</Label>
                          <select className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" value={form.category} onChange={set("category")}>
                            <option value="Seller">Seller</option>
                            <option value="Fashion">Fashion</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Home & Living">Home & Living</option>
                            <option value="Beauty">Beauty</option>
                            <option value="Sports">Sports</option>
                            <option value="Food">Food</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>GST Number (Optional)</Label>
                          <Input placeholder="22AAAAA0000A1Z5" value={form.gstNumber} onChange={set("gstNumber")} />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <textarea className="w-full px-3 py-2 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 min-h-[80px] resize-none" placeholder="Tell customers about your store..." value={form.description} onChange={set("description")} />
                        </div>
                      </>
                    )}

                    {/* Step 3: KYC & Bank + Documents */}
                    {step === 3 && (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-pink-600" /> KYC & Bank Details
                          </h3>
                          <span className="text-xs text-gray-400">Step 4 of 4</span>
                        </div>
                        <div className="space-y-2"><Label>PAN Number</Label><Input placeholder="ABCDE1234F" value={form.panNumber} onChange={set("panNumber")} /></div>
                        <hr className="border-gray-100" />
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bank Account</p>
                        <div className="space-y-2"><Label>Account Holder Name *</Label><Input placeholder="As per bank records" value={form.accountHolderName} onChange={set("accountHolderName")} /></div>
                        <div className="space-y-2"><Label>Account Number *</Label><Input placeholder="1234567890" value={form.accountNumber} onChange={set("accountNumber")} /></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>IFSC Code *</Label><Input placeholder="SBIN0001234" value={form.ifscCode} onChange={set("ifscCode")} /></div>
                          <div className="space-y-2"><Label>Bank Name</Label><Input placeholder="State Bank of India" value={form.bankName} onChange={set("bankName")} /></div>
                        </div>

                        {/* Document Uploads */}
                        <hr className="border-gray-100" />
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Documents (PAN Card, Aadhaar, GST Certificate, etc.)</p>
                        <label className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center cursor-pointer hover:border-pink-300 transition-colors">
                          <Upload className="w-6 h-6 text-gray-300 mb-1" />
                          <span className="text-xs text-gray-500">Click to upload documents (images or PDF)</span>
                          <input type="file" multiple accept="image/*,.pdf" className="hidden" onChange={handleDocAdd} />
                        </label>
                        {documents.length > 0 && (
                          <div className="space-y-2">
                            {documents.map((doc, i) => (
                              <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                                {doc.preview ? (
                                  <img src={doc.preview} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                                ) : (
                                  <div className="w-10 h-10 rounded bg-pink-50 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-5 h-5 text-pink-500" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <input
                                    className="text-sm font-medium text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-pink-500 focus:outline-none w-full truncate"
                                    value={doc.label}
                                    onChange={(e) => {
                                      const updated = [...documents];
                                      updated[i] = { ...updated[i], label: e.target.value };
                                      setDocuments(updated);
                                    }}
                                    placeholder="Document label"
                                  />
                                  <p className="text-xs text-gray-400 truncate">{doc.name}</p>
                                </div>
                                <button type="button" onClick={() => removeDoc(i)} className="p-1 hover:bg-red-50 rounded">
                                  <X className="w-4 h-4 text-red-400" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>

                <AlertBlock error={error} />

                {/* Navigation */}
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={prevStep} className="flex items-center gap-1">
                    <ChevronLeft className="h-4 w-4" /> Back
                  </Button>
                  <div className="flex-1" />
                  {step < 3 ? (
                    <Button onClick={nextStep} className="bg-pink-600 hover:bg-pink-700 flex items-center gap-1">
                      Continue <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit} disabled={loading} className="bg-pink-600 hover:bg-pink-700 gap-2">
                      {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : "Submit Application"}
                    </Button>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-center border-t pt-4">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <button type="button" onClick={() => { setStep(0); setActiveTab("signin"); }} className="font-medium text-pink-600 hover:text-pink-500">Sign in</button>
                </p>
              </CardFooter>
            </>
          )}
        </Card>
      </motion.div>
      </div>
    </div>
  );
}

function AlertBlock({ error, success }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4">
          <Alert variant="destructive" className="text-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}
      {success && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4">
          <Alert className="bg-green-50 text-green-800 border-green-200 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
