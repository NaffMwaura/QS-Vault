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
  Loader2,
  AlertCircle
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

const FeatureItem = ({ icon: Icon, title, description, theme }: any) => (
  <div className="flex items-start gap-5 group">
    <div className={`p-3 rounded-2xl border transition-all duration-500 group-hover:scale-110 text-amber-500
      ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-100 border-zinc-200 shadow-sm'}`}>
      <Icon size={20} />
    </div>
    <div className="text-left">
      <h4 className={`text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'}`}>
        {title}
      </h4>
      <p className={`text-[11px] font-medium leading-relaxed mt-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-600'}`}>
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

  /** * VALIDATION PROTOCOL 
   * Enforces: 8 chars min, mix of letters/numbers OR 1 capital letter if only letters.
   */
  const validateCredentials = (input: string) => {
    if (input.length < 8) return "Identifier must be at least 8 characters long!";
    
    const hasLetters = /[a-zA-Z]/.test(input);
    const hasNumbers = /[0-9]/.test(input);
    const hasCapitals = /[A-Z]/.test(input);

    if (hasLetters && !hasNumbers) {
      if (!hasCapitals) return "If using letters only, at least one must be a CAPITAL letter!";
    }
    
    return null;
  };

  /** * PROFILE SYNC HANDSHAKE
   * Fix: Corrected destructuring of metadata to prevent 'undefined' errors.
   */
  const syncProfile = async (user: any) => {
    if (!supabase || !user) return;
    
    // Safely extract metadata
    const metadata = user.user_metadata || {};
    const metaFullName = metadata.full_name || metadata.name; 
    const fallbackName = user.email ? user.email.split('@')[0] : 'Surveyor';

    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: metaFullName || username || fallbackName,
        username: username || fallbackName,
        role: 'user',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    } catch (err) {
      console.warn("Profile Sync Deferred:", err);
    }
  };

  /** * LOGIN HANDSHAKE */
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate based on username if registering, otherwise use email prefix
    const checkValue = isRegistering ? username : email.split('@')[0];
    const validationError = validateCredentials(checkValue);
    
    if (validationError) {
      setAuthStatus({ message: validationError, type: "error" });
      return;
    }

    if (!isOnline) {
      setAuthStatus({ message: "Infrastructure Offline. Please connect to login.", type: "error" });
      return;
    }
    if (!supabase) {
        setAuthStatus({ message: "Connecting to secure database...", type: "error" });
        return;
    }

    setLoading(true);
    setAuthStatus({ message: null, type: "success" });

    try {
      if (isRegistering) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, full_name: username },
            emailRedirectTo: window.location.origin + "/dashboard",
          },
        });
        if (error) throw error;
        if (data.user) await syncProfile(data.user);
        setAuthStatus({ message: "Account created! Please check your email to verify.", type: "success" });
      } else {
        const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
        const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD;

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (data.user) await syncProfile(data.user);

        if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
          navigate("/admin-dashboard");
          return;
        }

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
    <div className={`min-h-screen w-full flex flex-col lg:flex-row font-sans selection:bg-amber-500/30 transition-colors duration-500
      ${theme === 'dark' ? 'bg-[#09090b] text-white' : 'bg-zinc-50 text-zinc-900'}`}>
      
      {/* 1. LEFT SECTION: BRANDING & INFO */}
      <div className={`relative flex-1 p-12 lg:p-24 flex flex-col justify-between border-r transition-all duration-500
        ${theme === 'dark' ? 'border-zinc-800/40 bg-[#09090b]' : 'border-zinc-200 bg-white'}
        ${mobileView === "branding" ? "flex fixed inset-0 z-50" : "hidden lg:flex"}`}>
        
        <div className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[120px] animate-pulse pointer-events-none" />

        <div className="relative z-10 flex justify-between items-center">
          <button
            onClick={() => navigate("/")}
            className={`flex items-center gap-3 transition-all font-bold uppercase text-xs tracking-widest group
              ${theme === 'dark' ? 'text-zinc-500 hover:text-amber-500' : 'text-zinc-400 hover:text-amber-600'}`}
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Home
          </button>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all duration-700
               ${isOnline 
                 ? (theme === 'dark' ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500" : "bg-emerald-50 border-emerald-100 text-emerald-600") 
                 : "bg-red-500/5 border-red-500/20 text-red-500 animate-pulse"}`}>
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span>{isOnline ? "Connected" : "Offline"}</span>
            </div>
            <button onClick={() => setMobileView("form")} className={`lg:hidden p-3 rounded-2xl ${theme === 'dark' ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'}`}><ChevronRight size={18} /></button>
          </div>
        </div>

        <div className="relative z-10 space-y-12">
          <div className="space-y-6">
            <div className="flex items-center gap-5">
              <div className="p-3 bg-amber-500 rounded-2xl shadow-2xl shadow-amber-500/20">
                <HardHat size={32} className="text-black" />
              </div>
              <h1 className={`text-3xl font-black uppercase tracking-tighter italic ${theme === 'dark' ? 'text-amber-500' : 'text-zinc-900'}`}>QS VAULT<span className="text-amber-500">.</span></h1>
            </div>

            <h2 className={`text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-tight italic 
              ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>
              Site Mastery <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-200">Starts Here.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 max-w-md">
            <FeatureItem theme={theme} icon={Zap} title="High Precision" description="Digital takeoff tools built for fast and accurate site measurements." />
            <FeatureItem theme={theme} icon={ShieldCheck} title="Standards Compliant" description="Built-in SMM-KE logic to ensure your valuations are always correct." />
            <FeatureItem theme={theme} icon={Database} title="Secure Storage" description="All project data is encrypted and backed up automatically." />
          </div>
        </div>

        <div className={`relative z-10 flex items-center justify-between border-t pt-10 ${theme === 'dark' ? 'border-zinc-800/40' : 'border-zinc-100'}`}>
          <div className="flex items-center gap-4">
            <Ruler size={16} className={theme === 'dark' ? 'text-zinc-700' : 'text-zinc-300'} />
            <p className={`text-[10px] font-bold uppercase tracking-[0.5em] ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>PRO VERSION 2.5</p>
          </div>
          <button onClick={toggleTheme} className={`p-3 rounded-xl border transition-colors ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-amber-500' : 'bg-white border-zinc-200 text-zinc-400 hover:text-zinc-900 shadow-sm'}`}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {/* 2. RIGHT SECTION: LOGIN/SIGNUP FORM */}
      <div className={`flex-1 p-6 lg:p-24 flex items-center justify-center relative overflow-y-auto custom-scrollbar
        ${theme === 'dark' ? 'bg-zinc-950/20' : 'bg-zinc-100/50'}
        ${mobileView === "form" ? "flex" : "hidden lg:flex"}`}>
        
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(#f59e0b 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

        <div className="w-full max-w-lg relative z-10 py-12">
          <div className={`p-10 sm:p-16 rounded-[4rem] border backdrop-blur-3xl shadow-2xl transition-all duration-500
            ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 shadow-black' : 'bg-white border-zinc-200 shadow-zinc-200/20'}`}>
            
            <div className="flex justify-between items-start mb-10">
              <div className="text-left space-y-2">
                <h3 className={`text-3xl font-black uppercase tracking-tighter italic ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>
                  {isRegistering ? "Register" : "Login"}
                </h3>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  {isRegistering ? "Initialize your workspace node" : "Access your project records"}
                </p>
              </div>
              <button onClick={() => setMobileView("branding")} className={`lg:hidden p-3 rounded-2xl ${theme === 'dark' ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'}`}><Info size={24}/></button>
            </div>

            {authStatus.message && (
              <div className={`p-6 rounded-2xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-4 border mb-10 animate-in zoom-in-95
                ${authStatus.type === "success" 
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                  : "bg-rose-500/10 text-rose-600 border-rose-500/20"}`}>
                <AlertCircle size={20} className="shrink-0" />
                <span className="flex-1 leading-normal">{authStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-6">
              {isRegistering && (
                <div className="space-y-3 text-left">
                  <label className={`text-xs font-bold uppercase tracking-widest ml-5 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Username</label>
                  <div className="relative group">
                    <User size={20} className="absolute left-7 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                    <input
                      required type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username"
                      className={`w-full pl-16 pr-8 py-5 rounded-[2rem] text-lg font-medium border outline-none transition-all shadow-inner
                        ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-amber-500'}`}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3 text-left">
                <label className={`text-xs font-bold uppercase tracking-widest ml-5 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Email Address</label>
                <div className="relative group">
                  <Mail size={20} className="absolute left-7 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                  <input
                    required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@vault.com"
                    className={`w-full pl-16 pr-8 py-6 rounded-[2rem] text-lg font-medium border outline-none transition-all shadow-inner
                      ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-amber-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-amber-500'}`}
                  />
                </div>
              </div>

              <div className="space-y-3 text-left">
                <label className={`text-xs font-bold uppercase tracking-widest ml-5 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Password</label>
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
                className="w-full py-6 bg-amber-500 text-black rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl hover:bg-amber-400 active:scale-[0.97] transition-all flex items-center justify-center gap-4 italic"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : isRegistering ? "Sign Up" : "Login"}
              </button>
            </form>

            <div className="mt-10 space-y-6 text-center">
               <button
                  onClick={() => { setIsRegistering(!isRegistering); setAuthStatus({ message: null, type: "success" }); }}
                  className={`text-[11px] font-black uppercase tracking-widest transition-colors block mx-auto underline underline-offset-4
                    ${theme === 'dark' ? 'text-zinc-500 hover:text-amber-500' : 'text-zinc-400 hover:text-amber-600'}`}
                >
                  {isRegistering ? "Back to Login" : "Create Account"}
                </button>

                <div className="flex items-center gap-6 opacity-20">
                  <div className={`h-px flex-1 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-300'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Or continue with</span>
                  <div className={`h-px flex-1 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-300'}`} />
                </div>

                <button
                  onClick={handleGoogleLogin}
                  className={`w-full py-5 rounded-2xl border font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-5 transition-all
                    ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-900' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 shadow-sm'}`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5.04c1.94 0 3.51.68 4.75 1.81l3.5-3.5C18.1 1.42 15.29 0 12 0 7.31 0 3.25 2.69 1.24 6.62l4.08 3.16C6.29 7.3 8.93 5.04 12 5.04z" /><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.89 3c2.28-2.1 3.53-5.2 3.53-8.82z" /><path fill="#FBBC05" d="M5.32 14.22c-.24-.73-.38-1.5-.38-2.22s.14-1.49.38-2.22L1.24 6.62C.45 8.18 0 9.94 0 12c0 2.06.45 3.82 1.24 5.38l4.08-3.16z" /><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.89-3c-1.11.75-2.53 1.19-4.04 1.19-3.07 0-5.71-2.26-6.68-5.34l-4.08 3.16C3.25 21.31 7.31 24 12 24z" /></svg>
                  Google Workspace
                </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
      `}</style>
    </div>
  );
};

export default LoginPage;