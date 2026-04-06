/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import {
  Mail,
  CheckCircle,
  X,
  HardHat,
  ShieldCheck,
  Zap,
  Database,
  ArrowLeft,
  Ruler,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  Lock,
  User,
  Eye,
  EyeOff,
  Info,
  ChevronRight,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ======================================================
    MODULE RESOLUTION
   ====================================================== */

let supabase: any = null;
let useAuth: any = () => ({
  theme: 'dark',
  toggleTheme: () => {},
  isOnline: true
});

const resolveModules = async () => {
  try {
    const authMod = await import("../../features/auth/AuthContext");
    if (authMod.useAuth) useAuth = authMod.useAuth;

    const dbMod = await import("../../lib/database/database");
    if (dbMod.supabase) supabase = dbMod.supabase;
  } catch (e) {
    console.warn("Login Node: Local module resolution in standby.");
  }
};

resolveModules();

/** --- UI HELPERS --- **/

const FeatureItem = ({ icon: Icon, title, description }: any) => (
  <div className="flex items-start gap-5 group">
    <div className="p-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 transition-all duration-500 group-hover:scale-110 text-amber-500">
      <Icon size={20} />
    </div>
    <div className="text-left">
      <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-200">
        {title}
      </h4>
      <p className="text-[11px] text-zinc-500 font-medium leading-relaxed mt-1">
        {description}
      </p>
    </div>
  </div>
);

/** --- MAIN COMPONENT: LOGIN GATEWAY --- **/

const LoginPage: React.FC = () => {
  const { theme, toggleTheme, isOnline } = useAuth();
  const navigate = useNavigate();

  // Auth State
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<{message: string | null, type: 'success' | 'error'}>({
    message: null,
    type: "success",
  });

  // View State for Mobile Branding
  const [mobileView, setMobileView] = useState<"branding" | "form">("form");

  /** * LOGIN HANDSHAKE */
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setAuthStatus({ message: "You are currently offline. Please connect to login.", type: "error" });
      return;
    }
    if (!supabase) {
        setAuthStatus({ message: "Connecting to database...", type: "error" });
        return;
    }

    setLoading(true);
    setAuthStatus({ message: null, type: "success" });

    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, full_name: username },
            emailRedirectTo: window.location.origin + "/dashboard",
          },
        });
        if (error) throw error;
        setAuthStatus({ message: "Account created! Please check your email to verify.", type: "success" });
      } else {
        // Securely pull credentials from .env
        const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
        const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD;

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Admin Node Direction
        if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
          navigate("/admin-dashboard");
          return;
        }

        // Role Check
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data?.user?.id)
          .single();

        if (profile?.role === "admin" || profile?.role === "super-admin") {
          navigate("/admin-dashboard");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err: any) {
      setAuthStatus({ message: err.message || "Login failed. Please check your details.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isOnline || !supabase) return;
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/dashboard" },
      });
      if (error) throw error;
    } catch (err: any) {
      setAuthStatus({ message: "Google login failed.", type: "error" });
    }
  };

  return (
    <div className={`h-screen w-screen flex flex-col lg:flex-row font-sans selection:bg-amber-500/30 overflow-hidden transition-colors duration-500
      ${theme === 'dark' ? 'bg-[#09090b] text-white' : 'bg-zinc-50 text-zinc-900'}`}>
      
      {/* 1. LEFT SECTION: BRANDING & INFO (With increased side spacing) */}
      <div className={`relative flex-1 p-12 lg:p-24 flex flex-col justify-between border-r border-zinc-800/40 transition-all duration-500
        ${mobileView === "branding" ? "flex fixed inset-0 z-50 bg-[#09090b]" : "hidden lg:flex"}`}>
        
        <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[120px] animate-pulse pointer-events-none" />

        <div className="relative z-10 flex justify-between items-center">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 text-zinc-500 hover:text-amber-500 transition-all font-bold uppercase text-xs tracking-widest group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Home
          </button>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all duration-700
               ${isOnline ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500" : "bg-red-500/5 border-red-500/20 text-red-500 animate-pulse"}`}>
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span>{isOnline ? "Connected" : "Offline"}</span>
            </div>
            <button onClick={() => setMobileView("form")} className="lg:hidden p-3 rounded-2xl bg-zinc-800 text-zinc-400"><ChevronRight size={18} /></button>
          </div>
        </div>

        <div className="relative z-10 space-y-12">
          <div className="space-y-6">
            <div className="flex items-center gap-5">
              <div className="p-3 bg-amber-500 rounded-2xl shadow-2xl shadow-amber-500/20">
                <HardHat size={32} className="text-black" />
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tighter italic">QS VAULT<span className="text-amber-500">.</span></h1>
            </div>

            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-tight italic text-zinc-100">
              Site Mastery <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-200">Starts Here.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 max-w-md">
            <FeatureItem icon={Zap} title="High Precision" description="Digital takeoff tools built for fast and accurate site measurements." />
            <FeatureItem icon={ShieldCheck} title="Standards Compliant" description="Built-in SMM-KE logic to ensure your valuations are always correct." />
            <FeatureItem icon={Database} title="Secure Storage" description="All project data is encrypted and backed up automatically." />
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-zinc-800/40 pt-10">
          <div className="flex items-center gap-4">
            <Ruler size={16} className="text-zinc-700" />
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-600">PRO VERSION 2.5</p>
          </div>
          <button onClick={toggleTheme} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-amber-500 transition-colors">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {/* 2. RIGHT SECTION: FORM (With centered layout and bigger fonts) */}
      <div className={`flex-1 p-12 lg:p-24 flex items-center justify-center relative bg-zinc-950/20 h-full
        ${mobileView === "form" ? "flex" : "hidden lg:flex"}`}>
        
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(#f59e0b 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

        <div className="w-full max-w-lg relative z-10">
          <div className={`p-12 sm:p-16 rounded-[4rem] border backdrop-blur-3xl shadow-2xl transition-all duration-500
            ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            
            <div className="flex justify-between items-start mb-12">
              <div className="text-left space-y-2">
                <h3 className="text-3xl font-black uppercase tracking-tighter italic">
                  {isRegistering ? "Create Account" : "Login"}
                </h3>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  {isRegistering ? "Register your new workspace" : "Access your project records"}
                </p>
              </div>
              <button onClick={() => setMobileView("branding")} className="lg:hidden p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500"><Info size={24}/></button>
            </div>

            {authStatus.message && (
              <div className={`p-6 rounded-2xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-4 border mb-10 animate-in zoom-in-95
                ${authStatus.type === "success" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"}`}>
                {authStatus.type === "success" ? <CheckCircle size={20} /> : <X size={20} />}
                <span className="flex-1 leading-normal">{authStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-8">
              {isRegistering && (
                <div className="space-y-3 text-left">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-5">Username</label>
                  <div className="relative group">
                    <User size={20} className="absolute left-7 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                    <input
                      required type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username"
                      className={`w-full pl-16 pr-8 py-6 rounded-[2rem] text-lg font-medium border outline-none transition-all shadow-inner
                        ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-amber-500'}`}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3 text-left">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-5">Email Address</label>
                <div className="relative group">
                  <Mail size={20} className="absolute left-7 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                  <input
                    required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com"
                    className={`w-full pl-16 pr-8 py-6 rounded-[2rem] text-lg font-medium border outline-none transition-all shadow-inner
                      ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-amber-500'}`}
                  />
                </div>
              </div>

              <div className="space-y-3 text-left">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-5">Password</label>
                <div className="relative group">
                  <Lock size={20} className="absolute left-7 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                  <input
                    required type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                    className={`w-full pl-16 pr-20 py-6 rounded-[2rem] text-lg font-medium border outline-none transition-all shadow-inner
                      ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-amber-500'}`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-7 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-amber-500 transition-colors">
                    {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                  </button>
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-7 bg-amber-500 text-black rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-amber-400 active:scale-[0.97] transition-all flex items-center justify-center gap-4 italic"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : isRegistering ? "Sign Up" : "Login"}
              </button>
            </form>

            <div className="mt-12 space-y-8">
               <button
                  onClick={() => { setIsRegistering(!isRegistering); setAuthStatus({ message: null, type: "success" }); }}
                  className="text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-amber-500 transition-colors block mx-auto underline underline-offset-4"
                >
                  {isRegistering ? "Back to Login" : "Create a new account"}
                </button>

                <div className="flex items-center gap-6 opacity-20">
                  <div className="h-px flex-1 bg-zinc-800" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Or login with</span>
                  <div className="h-px flex-1 bg-zinc-800" />
                </div>

                <button
                  onClick={handleGoogleLogin}
                  className={`w-full py-6 rounded-2xl border font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-5 transition-all
                    ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-900' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'}`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5.04c1.94 0 3.51.68 4.75 1.81l3.5-3.5C18.1 1.42 15.29 0 12 0 7.31 0 3.25 2.69 1.24 6.62l4.08 3.16C6.29 7.3 8.93 5.04 12 5.04z" /><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.89 3c2.28-2.1 3.53-5.2 3.53-8.82z" /><path fill="#FBBC05" d="M5.32 14.22c-.24-.73-.38-1.5-.38-2.22s.14-1.49.38-2.22L1.24 6.62C.45 8.18 0 9.94 0 12c0 2.06.45 3.82 1.24 5.38l4.08-3.16z" /><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.89-3c-1.11.75-2.53 1.19-4.04 1.19-3.07 0-5.71-2.26-6.68-5.34l-4.08 3.16C3.25 21.31 7.31 24 12 24z" /></svg>
                  Google Workspace
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;