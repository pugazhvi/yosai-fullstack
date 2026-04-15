import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, User, Sparkles, ShoppingBag, Heart, Zap, Store, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Auth() {
  const [isSignup, setIsSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const { login, register, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  const getDefaultRedirect = (role) => {
    if (redirectTo) return redirectTo;
    if (role === "admin") return "/admin/dashboard";
    if (role === "vendor") return "/vendor/dashboard";
    return "/";
  };

  // If already logged in, redirect immediately
  useEffect(() => {
    if (user && !authLoading) navigate(getDefaultRedirect(user.role), { replace: true });
  }, [user, authLoading]);

  useEffect(() => {
    if (searchParams.get("signup")) { setIsSignup(true); setActiveTab("signup"); }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      if (isSignup) {
        if (confirmPassword !== password) { setError("Passwords do not match"); setIsLoading(false); return; }
        const res = await register({ name, email, password });
        setSuccess("Account created successfully!");
        navigate(getDefaultRedirect(res.user?.role));
      } else {
        const res = await login(email, password);
        setSuccess("Sign in successful!");
        navigate(getDefaultRedirect(res.user?.role));
      }
    } catch (err) {
      setError(err?.message || "Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    setIsSignup(value === "signup");
    setError("");
    setSuccess("");
  };

  const perks = [
    { icon: ShoppingBag, text: "Shop curated fashion" },
    { icon: Heart, text: "Save your favourites" },
    { icon: Zap, text: "Track orders in real-time" },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-stretch">
      {/* Decorative orbs */}
      <motion.div
        className="absolute -top-24 -left-24 w-96 h-96 bg-pink-300/30 rounded-full blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-28 -right-24 w-[28rem] h-[28rem] bg-purple-300/30 rounded-full blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* LEFT — Seller CTA panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-rose-500 to-purple-600" />
        <div className="absolute top-10 right-10 w-40 h-40 border-2 border-white/10 rounded-full" />
        <div className="absolute bottom-20 left-10 w-24 h-24 border-2 border-white/10 rounded-full" />
        <div className="absolute top-1/2 right-1/3 w-6 h-6 bg-white/10 rounded-full" />
        <div className="absolute top-20 left-20 w-4 h-4 bg-white/20 rounded-full" />

        {/* Floating sparkles in seller panel */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute pointer-events-none"
            style={{ left: `${15 + i * 20}%`, top: `${20 + (i % 2) * 40}%` }}
            animate={{ y: [0, -15, 0], opacity: [0.4, 0.9, 0.4], rotate: [0, 180, 360] }}
            transition={{ duration: 4 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
          >
            <Sparkles className="w-4 h-4 text-white/60" />
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-white max-w-md"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 mb-6">
            <Store className="w-3.5 h-3.5" />
            <span className="text-xs font-medium tracking-wide">For Sellers</span>
          </div>

          <h2 className="text-4xl xl:text-5xl font-bold leading-[1.1] mb-4 tracking-tight">
            Sell your<br />creations on <span className="text-amber-300">Yosai</span>
          </h2>
          <p className="text-white/80 text-base leading-relaxed mb-8">
            Reach thousands of fashion lovers across India. List unlimited products, manage orders, and grow your brand — all in one place.
          </p>

          <div className="space-y-3 mb-8">
            {[
              { icon: ShoppingBag, text: "Zero listing fees" },
              { icon: Zap, text: "Fast 7-day payouts" },
              { icon: Heart, text: "Dedicated seller support" },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium">{f.text}</span>
              </motion.div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/vendor/onboarding?signup=1")}
            className="group inline-flex items-center gap-2 px-6 py-3.5 bg-white text-pink-600 font-semibold rounded-full shadow-2xl shadow-black/20 hover:shadow-3xl transition-all"
          >
            Register as Seller
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.button>

          <div className="flex items-center gap-2 mt-6 text-xs text-white/70">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-amber-300 border-2 border-pink-500" />
              <div className="w-6 h-6 rounded-full bg-green-300 border-2 border-pink-500" />
              <div className="w-6 h-6 rounded-full bg-blue-300 border-2 border-pink-500" />
            </div>
            <span>Trusted by 500+ sellers</span>
          </div>
        </motion.div>
      </div>

      {/* RIGHT — Customer auth form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 relative z-10">
        {/* Mobile-only floating sparkles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute pointer-events-none lg:hidden"
            style={{ left: `${10 + i * 18}%`, top: `${15 + (i % 3) * 25}%` }}
            animate={{ y: [0, -18, 0], opacity: [0.3, 0.7, 0.3], rotate: [0, 180, 360] }}
            transition={{ duration: 5 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
          >
            <Sparkles className={`w-4 h-4 ${i % 2 ? "text-pink-400" : "text-purple-400"}`} />
          </motion.div>
        ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }} className="mx-auto flex justify-center">
            <img className="h-12 w-auto" src="/logo.png" alt="Yosai" onError={(e) => { e.target.style.display = "none"; }} />
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-3 tracking-tight">
            {isSignup ? "Join Yosai" : "Welcome Back"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isSignup ? "Create your account to start shopping" : "Sign in to continue your journey"}
          </p>
        </div>

        <Card className="border-0 shadow-2xl shadow-pink-500/10 bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardHeader className="pb-2 px-6 sm:px-8 pt-6">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100/80 rounded-xl p-1 h-11">
                <TabsTrigger value="signin" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Sign Up</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="pt-5 px-6 sm:px-8 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, x: isSignup ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-4">
                  {isSignup && (
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="flex items-center gap-1.5 text-xs"><User className="h-3.5 w-3.5 text-gray-400" /> Full Name</Label>
                      <Input id="name" type="text" placeholder="Your name" className="h-11 rounded-xl" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="flex items-center gap-1.5 text-xs"><Mail className="h-3.5 w-3.5 text-gray-400" /> Email</Label>
                    <Input id="email" type="email" placeholder="name@example.com" className="h-11 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="flex items-center gap-1.5 text-xs"><Lock className="h-3.5 w-3.5 text-gray-400" /> Password</Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="h-11 rounded-xl pr-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {isSignup && (
                    <div className="space-y-1.5">
                      <Label htmlFor="confirm-password" className="flex items-center gap-1.5 text-xs"><Lock className="h-3.5 w-3.5 text-gray-400" /> Confirm Password</Label>
                      <div className="relative">
                        <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" className="h-11 rounded-xl pr-10" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required={isSignup} />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                    <Alert variant="destructive" className="text-sm rounded-xl"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
                  </motion.div>
                )}
                {success && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                    <Alert className="bg-green-50 text-green-800 border-green-200 text-sm rounded-xl"><CheckCircle2 className="h-4 w-4 text-green-600" /><AlertTitle>Success</AlertTitle><AlertDescription>{success}</AlertDescription></Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 shadow-lg shadow-pink-500/30 text-base font-semibold rounded-xl transition-all hover:scale-[1.01]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  <span>{isSignup ? "Create Account" : "Sign In"}</span>
                )}
              </Button>

              {/* Perks row on signup */}
              {isSignup && (
                <div className="flex items-center justify-center gap-4 pt-1 text-[11px] text-gray-500">
                  {perks.map((p, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <p.icon className="w-3 h-3 text-pink-500" />
                      <span>{p.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-gray-100 pt-4 pb-5 px-6 sm:px-8">
            <p className="text-center text-sm text-gray-600">
              {isSignup ? "Already have an account? " : "Don't have an account? "}
              <button type="button" onClick={() => handleTabChange(isSignup ? "signin" : "signup")} className="font-semibold text-pink-600 hover:text-pink-500">
                {isSignup ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-4">
          By continuing, you agree to Yosai's <span className="text-pink-500 cursor-pointer hover:underline">Terms</span> & <span className="text-pink-500 cursor-pointer hover:underline">Privacy Policy</span>
        </p>

        {/* Mobile-only seller CTA */}
        <div className="lg:hidden mt-6 p-4 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Want to sell?</p>
              <p className="text-[11px] text-white/80">Register as a seller</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/vendor/onboarding?signup=1")}
            className="px-3 py-1.5 bg-white text-pink-600 text-xs font-semibold rounded-full flex items-center gap-1 flex-shrink-0"
          >
            Join <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
      </div>
    </div>
  );
}
