import React, { useState, useEffect } from 'react';
import { 
  Mail, CheckCircle, X, HardHat, ShieldCheck, Zap, 
  Database, ArrowLeft, Ruler, Wifi, WifiOff, Sun, Moon,
  Lock,  Eye, EyeOff
} from 'lucide-react';
import { supabase } from "../../lib/database/database"; 
import { useAuth } from "../../features/auth/AuthContext";

/** --- TYPES & INTERFACES --- **/

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

interface AuthStatus {
  message: string | null;
  type: 'success' | 'error';
}

interface FeatureItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
  theme: 'light' | 'dark';
}

/** --- UI COMPONENTS --- **/

const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
  const baseStyles = "disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center font-black uppercase text-[11px] tracking-[0.2em] rounded-2xl py-6";
  const variants = {
    primary: "bg-amber-500 hover:bg-amber-400 text-black shadow-xl shadow-amber-500/20",
    secondary: "bg-white hover:bg-zinc-50 text-black shadow-lg border border-zinc-200",
    outline: "bg-transparent border border-zinc-800 text-zinc-500 hover:text-amber-500 hover:border-amber-500/50"
  };

  return (
    <button {...props} className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const FeatureItem: React.FC<FeatureItemProps> = ({ icon: Icon, title, description, theme }) => (
  <div className="flex items-start gap-4 group">
    <div className={`p-3 rounded-xl border transition-all duration-500 group-hover:scale-110 
      ${theme === 'dark' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-amber-500/5 border-amber-500/10 text-amber-600'}`}>
      <Icon size={20} />
    </div>
    <div className="text-left">
      <h4 className={`text-[11px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'}`}>{title}</h4>
      <p className="text-[10px] text-zinc-500 font-bold leading-relaxed mt-1">{description}</p>
    </div>
  </div>
);

/** --- MAIN LOGIN PAGE --- **/

const LoginPage: React.FC = () => {
  const auth = useAuth();
  
  // Safely extract properties to avoid ts(2339) errors if context is still updating
  const theme = auth?.theme || 'dark';
  const toggleTheme = auth?.toggleTheme || (() => {});
  
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ message: null, type: 'success' });
  
  // Robust Online Detection Heartbeat
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleStatus);
    window.addEventListener("offline", handleStatus);
    return () => {
      window.removeEventListener("online", handleStatus);
      window.removeEventListener("offline", handleStatus);
    };
  }, []);

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setAuthStatus({ message: "Infrastructure Link Offline. Cannot reach vault.", type: 'error' });
      return;
    }
    setLoading(true);
    setAuthStatus({ message: null, type: 'success' });

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Vault access denied. Verify credentials.";
      setAuthStatus({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isOnline) return;
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/dashboard' },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google gateway handshake failed.";
      setAuthStatus({ message: msg, type: 'error' });
    }
  };

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row font-sans selection:bg-amber-500/30 overflow-x-hidden transition-colors duration-500 
      ${theme === 'dark' ? 'bg-[#09090b]' : 'bg-zinc-100'}`}>
      
      {/* 1. LEFT SECTION: BRANDING & SYSTEM INFO */}
      <div className={`relative flex-1 p-8 md:p-16 lg:p-24 flex flex-col justify-between overflow-hidden lg:min-h-screen border-r 
        ${theme === 'dark' ? 'border-zinc-800/40 bg-zinc-950/40' : 'border-zinc-200 bg-white'}`}>
        
        <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] animate-pulse 
          ${theme === 'dark' ? 'bg-amber-500/5' : 'bg-amber-500/3'}`} />
        
        <div className="relative z-10 flex justify-between items-center">
          <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 text-zinc-600 hover:text-amber-500 transition-colors font-black uppercase text-[10px] tracking-[0.2em] group w-fit">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Overview
          </button>
          
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[9px] font-black transition-all duration-500 uppercase tracking-[0.2em] 
            ${isOnline ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600' : 'bg-red-500/5 border-red-500/20 text-red-500 animate-pulse'}`}>
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span className="hidden sm:inline">{isOnline ? "Gateway Active" : "Offline Vault"}</span>
          </div>
        </div>

        <div className="relative z-10 space-y-12 py-12">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500 rounded-2xl shadow-xl shadow-amber-500/20 animate-float">
                <HardHat size={32} className="text-black" />
              </div>
              <div className={`h-8 w-px rotate-12 mx-2 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
              <h1 className={`text-3xl font-black uppercase tracking-tighter italic ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>QS Vault</h1>
            </div>
            
            <h2 className={`text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.85] italic ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              Precision Takeoff<br />
              <span className="text-amber-500">Starts Here.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-8 max-w-2xl">
            <FeatureItem icon={Zap} title="Instant Digital Takeoffs" description="Calculate measurements with millimetric precision." theme={theme} />
            <FeatureItem icon={ShieldCheck} title="Offline-First Vault" description="Work at remote sites with zero connectivity." theme={theme} />
            <FeatureItem icon={Database} title="Centralized Library" description="Secure repository for regional SMM standards." theme={theme} />
          </div>

          {/* Precision Logic Illustration */}
          <div className={`p-8 rounded-3xl font-mono text-[11px] space-y-2 backdrop-blur-md hidden md:block border transition-all duration-500 max-w-lg
            ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800/50 hover:border-amber-500/30' : 'bg-zinc-50 border-zinc-200 hover:border-amber-500/40'}`}>
            <div className="flex gap-1.5 mb-4 opacity-50">
               <div className="w-2 h-2 rounded-full bg-red-500" />
               <div className="w-2 h-2 rounded-full bg-amber-500" />
               <div className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-zinc-600">// Measurement Handshake protocol</p>
            <p className="text-zinc-400"><span className="text-amber-500">const</span> <span className="text-blue-400">unlockVault</span> = (user) =&gt; &#123;</p>
            <p className="text-zinc-400">&nbsp;&nbsp;<span className="text-amber-500">if</span> (!user.authenticated) <span className="text-red-500">throw</span> Error(<span className="text-emerald-500">"SECURE_LOCK"</span>);</p>
            <p className="text-zinc-400">&nbsp;&nbsp;<span className="text-amber-500">return</span> <span className="text-blue-400">SMM_Compliance</span>.initialize();</p>
            <p className="text-zinc-400">&#125;;</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between opacity-50">
           <div className="flex items-center gap-4">
             <Ruler size={16} className="text-amber-500 animate-slide-slow" />
             <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">GATEWAY / QS-PV2.0</p>
           </div>
           <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-amber-500/10 transition-colors">
             {theme === 'dark' ? <Sun size={14} className="text-zinc-500" /> : <Moon size={14} className="text-zinc-500" />}
           </button>
        </div>
      </div>

      {/* 2. RIGHT SECTION: AUTH FORM */}
      <div className="flex-1 p-6 md:p-12 lg:p-24 flex items-center justify-center relative bg-zinc-950/10">
        <div className="w-full max-w-xl relative z-10">
          <div className={`backdrop-blur-3xl p-10 md:p-16 rounded-[3.5rem] border shadow-2xl space-y-10 transition-all 
            ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800/60 shadow-black/50' : 'bg-white/80 border-zinc-200'}`}>
            
            <div className="space-y-3 text-left">
              <h3 className={`text-4xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Authorize<span className="text-amber-500 italic">.</span></h3>
              <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] leading-relaxed max-w-sm">Secure access to project data and takeoff tools.</p>
            </div>

            {authStatus.message && (
              <div className={`p-5 rounded-3xl text-[11px] font-black uppercase tracking-widest flex items-center gap-4 border animate-in zoom-in-95 
                ${authStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                {authStatus.type === 'success' ? <CheckCircle size={14} /> : <X size={14} />}
                <span className="flex-1">{authStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleEmailPasswordLogin} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-3 text-left">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-3 italic">Vault Identifier (Email)</label>
                <div className="relative group">
                  <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                  <input 
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)} 
                    placeholder="surveyor@vault.co" 
                    className={`w-full pl-16 pr-8 py-6 rounded-3xl text-sm font-bold border outline-none transition-all focus:ring-4 ring-amber-500/10
                      ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800 text-white placeholder-zinc-800 focus:border-amber-500/40' 
                                         : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-300 focus:border-amber-500/60'}`} 
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-3 text-left">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-3 italic">Access Code (Password)</label>
                <div className="relative group">
                  <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                  <input 
                    type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    className={`w-full pl-16 pr-14 py-6 rounded-3xl text-sm font-bold border outline-none transition-all focus:ring-4 ring-amber-500/10
                      ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800 text-white placeholder-zinc-800 focus:border-amber-500/40' 
                                         : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-300 focus:border-amber-500/60'}`} 
                  />
                  <button 
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-amber-500"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Validating Session..." : "Unlock Vault Session"}
              </Button>
            </form>

            <div className="relative flex items-center py-2">
              <div className={`grow h-px ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
              <span className="shrink mx-6 text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500">Node Authentication</span>
              <div className={`grow h-px ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
            </div>

            <Button onClick={handleGoogleLogin} variant="secondary" className="w-full gap-4">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.94 0 3.51.68 4.75 1.81l3.5-3.5C18.1 1.42 15.29 0 12 0 7.31 0 3.25 2.69 1.24 6.62l4.08 3.16C6.29 7.3 8.93 5.04 12 5.04z" />
                <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.89 3c2.28-2.1 3.53-5.2 3.53-8.82z" />
                <path fill="#FBBC05" d="M5.32 14.22c-.24-.73-.38-1.5-.38-2.22s.14-1.49.38-2.22L1.24 6.62C.45 8.18 0 9.94 0 12c0 2.06.45 3.82 1.24 5.38l4.08-3.16z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.89-3c-1.11.75-2.53 1.19-4.04 1.19-3.07 0-5.71-2.26-6.68-5.34l-4.08 3.16C3.25 21.31 7.31 24 12 24z" />
              </svg>
              Google Identity Access
            </Button>

            <div className="flex justify-center items-center gap-3 group">
              <ShieldCheck size={14} className="text-emerald-500" />
              <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest leading-none">AES-256 Cloud Synchronization Active</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes slide-slow { 0%, 100% { transform: translateX(0); opacity: 0.3; } 50% { transform: translateX(10px); opacity: 0.8; } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-slide-slow { animation: slide-slow 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default LoginPage;