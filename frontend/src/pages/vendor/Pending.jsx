import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, LogOut, ShieldCheck, FileText, Sparkles, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VendorPending() {
  const { vendor, user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/vendor/onboarding", { replace: true });
    if (vendor?.status === "approved") navigate("/vendor/dashboard", { replace: true });
  }, [user, vendor]);

  const steps = [
    { icon: FileText, title: "Application Received", done: true, desc: "We've got your details" },
    { icon: ShieldCheck, title: "Under Review", done: false, active: true, desc: "Our team is verifying your info" },
    { icon: CheckCircle2, title: "Welcome Aboard", done: false, desc: "Start selling on Yosai" },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center px-4 py-8">
      {/* Animated gradient blobs */}
      <motion.div
        className="absolute top-[-120px] left-[-120px] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-pink-300/40 to-purple-300/40 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-100px] right-[-100px] w-[350px] h-[350px] rounded-full bg-gradient-to-br from-amber-300/40 to-orange-300/40 blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, -40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating sparkles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{ left: `${15 + i * 13}%`, top: `${20 + (i % 3) * 25}%` }}
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.8, 0.3], rotate: [0, 180, 360] }}
          transition={{ duration: 4 + i * 0.5, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
        >
          <Sparkles className={`w-4 h-4 ${i % 2 ? "text-pink-400" : "text-purple-400"}`} />
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-4xl"
      >
        <div className="grid md:grid-cols-2 bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl shadow-pink-500/10 border border-white/50 overflow-hidden">

          {/* LEFT — Hero illustration */}
          <div className="relative bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 p-8 md:p-10 flex flex-col items-center justify-center text-center text-white overflow-hidden">
            {/* Decorative rings */}
            <div className="absolute top-6 right-6 w-24 h-24 border-2 border-white/10 rounded-full" />
            <div className="absolute bottom-8 left-8 w-16 h-16 border-2 border-white/10 rounded-full" />
            <div className="absolute top-1/2 left-6 w-4 h-4 bg-white/20 rounded-full" />
            <div className="absolute top-10 left-1/2 w-3 h-3 bg-white/30 rounded-full" />

            {/* Main animated badge */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 150, damping: 15, delay: 0.2 }}
              className="relative w-40 h-40 mb-6"
            >
              {/* Outer spinning dotted ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-dashed border-white/40"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
              {/* Pulsing glow */}
              <motion.div
                className="absolute inset-3 rounded-full bg-white/20 blur-md"
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Inner badge */}
              <div className="absolute inset-4 rounded-full bg-white flex items-center justify-center shadow-2xl">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ShieldCheck className="w-16 h-16 text-pink-600" strokeWidth={1.8} />
                </motion.div>
              </div>
              {/* Orbit particles */}
              {[0, 120, 240].map((angle, i) => (
                <motion.div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-amber-300 shadow-lg"
                  style={{ transformOrigin: "0 0" }}
                  animate={{ rotate: [angle, angle + 360] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                >
                  <div className="absolute" style={{ left: 78, top: -6 }}>
                    <div className="w-3 h-3 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 mb-4"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
              <span className="text-xs font-medium tracking-wide">Review in progress</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold mb-3 tracking-tight"
            >
              You're<br />Almost There!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="text-white/80 text-sm leading-relaxed max-w-xs"
            >
              Hang tight while our team reviews your application. Good things are on the way ✨
            </motion.p>
          </div>

          {/* RIGHT — Status & actions */}
          <div className="p-8 md:p-10 flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">Status</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 tracking-tight">Under Verification</h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Your seller registration is being reviewed. Typical verification time: <span className="font-semibold text-gray-900">1–7 working days</span>.
            </p>

            {/* Timeline */}
            <div className="relative space-y-4 mb-6">
              <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-green-400 via-pink-300 to-gray-200" />
              {steps.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.15 }}
                    className="relative flex items-start gap-3"
                  >
                    <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                      s.done
                        ? "bg-green-500 border-green-500 text-white"
                        : s.active
                        ? "bg-white border-pink-500 text-pink-600 shadow-lg shadow-pink-500/30"
                        : "bg-white border-gray-200 text-gray-400"
                    }`}>
                      {s.active && (
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-pink-400"
                          animate={{ scale: [1, 1.4, 1.4], opacity: [0.7, 0, 0] }}
                          transition={{ duration: 1.8, repeat: Infinity }}
                        />
                      )}
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className={`text-sm font-semibold ${s.active ? "text-pink-600" : s.done ? "text-green-600" : "text-gray-700"}`}>
                        {s.title}
                        {s.active && <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] font-normal text-pink-500">
                          <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }}>●</motion.span>
                          <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}>●</motion.span>
                          <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}>●</motion.span>
                        </span>}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Email tip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-100 mb-5"
            >
              <Mail className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 leading-relaxed">
                We'll email <span className="font-semibold">{user?.email || "you"}</span> as soon as your account is approved.
              </p>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="space-y-3 mt-auto"
            >
              <Button
                className="w-full h-12 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white gap-2 text-sm font-semibold shadow-lg shadow-pink-500/30 hover:shadow-xl transition-all"
                onClick={() => window.open("https://wa.me/919361663823?text=Hi%20Yosai%2C%20I%20have%20submitted%20my%20seller%20application%20and%20want%20to%20check%20the%20status.", "_blank")}
              >
                <MessageCircle className="h-5 w-5" /> Contact Support
              </Button>
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 gap-2 text-sm font-medium transition-all"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
