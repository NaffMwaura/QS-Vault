import React, { useState, useEffect } from 'react';
import { 
  Mail, CheckCircle, X, HardHat, ShieldCheck, Zap, 
  Database, ArrowLeft, Ruler, Wifi, WifiOff, Sun, Moon,
  Lock, User, Eye, EyeOff, Info, ChevronRight
} from 'lucide-react';
import { supabase } from "../../lib/database/database"; 
import { useAuth } from "../../features/auth/AuthContext";

/** --- TYPES & INTERFACES --- **/

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
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
  const baseStyles = "disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center font-black uppercase text-[11px] tracking-[0.2em] rounded-2xl py-5 px-6";
  const variants = {
    primary: "bg-amber-500 hover:bg-amber-400 text-black shadow-xl shadow-amber-500/20",
    secondary: "bg-white hover:bg-zinc-50 text-black shadow-lg border border-zinc-200",
    outline: "bg-transparent border border-zinc-800 text-zinc-500 hover:text-amber-500 hover:border-amber-500/50",
    ghost: "bg-transparent text-zinc-500 hover:text-amber-500"
  };

  return (
    <button {...props} className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const FeatureItem: React.FC<FeatureItemProps> = ({ icon: Icon, title, description, theme }) => (
  <div className="flex items-start gap-4 group">
    <div className={`p-2.5 rounded-xl border transition-all duration-500 group-hover:scale-110 
      ${theme === 'dark' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-amber-500/5 border-amber-500/10 text-amber-600'}`}>
      <Icon size={18} />
    </div>
    <div className="text-left">
      <h4 className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'}`}>{title}</h4>
      <p className="text-[9px] text-zinc-500 font-bold leading-relaxed mt-0.5">{description}</p>
    </div>
  </div>
);

/** --- MAIN LOGIN PAGE --- **/

const LoginPage: React.FC = () => {
  const auth = useAuth();
  
  // Safety extraction for Canvas environment
  const theme = auth?.theme || 'dark';
  const toggleTheme = auth?.toggleTheme || (() => {});
  
  // Auth Mode & Form State
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ message: null, type: 'success' });
  
  // Mobile View State: 'branding' or 'form'
  const [mobileView, setMobileView] = useState<'branding' | 'form'>('form');

  // Online Detection Logic
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      setAuthStatus({ message: "Infrastructure Offline. Gateway access suspended.", type: 'error' });
      return;
    }
    setLoading(true);
    setAuthStatus({ message: null, type: 'success' });

    try {
      if (isRegistering) {
        // Sign Up with Username stored in user_metadata
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, full_name: username },
            emailRedirectTo: window.location.origin + '/dashboard',
          }
        });
        if (error) throw error;
        setAuthStatus({ message: "Account Initiated. Please verify your email.", type: 'success' });
      } else {
        // Standard Sign In
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = '/dashboard';
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Handshake failed. Access denied.";
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
      const msg = err instanceof Error ? err.message : "Google gateway failed.";
      setAuthStatus({ message: msg, type: 'error' });
    }
  };

  return (
    <div className={`h-screen w-screen flex flex-col lg:flex-row font-sans selection:bg-amber-500/30 overflow-hidden transition-colors duration-500 
      ${theme === 'dark' ? 'bg-[#09090b]' : 'bg-zinc-100'}`}>
      
      {/* 1. LEFT SECTION: BRANDING & SPECS (Visible on Desktop / Toggleable on Mobile) */}
      <div className={`relative flex-1 p-8 md:p-12 lg:p-20 flex flex-col justify-between border-r transition-all duration-500
        ${mobileView === 'branding' ? 'flex fixed inset-0 z-50 bg-inherit' : 'hidden lg:flex'}
        ${theme === 'dark' ? 'border-zinc-800/40 bg-zinc-950/40' : 'border-zinc-200 bg-white'}`}>
        
        <div className={`absolute top-[-5%] left-[-5%] w-[50%] h-[50%] rounded-full blur-[100px] animate-pulse 
          ${theme === 'dark' ? 'bg-amber-500/5' : 'bg-amber-500/3'}`} />
        
        <div className="relative z-10 flex justify-between items-center">
          <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 text-amber-400 hover:text-amber-500 transition-colors font-black uppercase text-[15px] tracking-[0.2em] group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Portal Home
          </button>
          
          <div className="flex items-center gap-4">
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black transition-all duration-500 uppercase tracking-[0.2em] 
               ${isOnline ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600' : 'bg-red-500/5 border-red-500/20 text-red-500 animate-pulse'}`}>
               {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
               <span className="hidden sm:inline">{isOnline ? "Active Link" : "Offline Vault"}</span>
             </div>
             <button onClick={() => setMobileView('form')} className="lg:hidden p-2 rounded-full bg-zinc-500/10 text-zinc-500">
                <ChevronRight size={18} />
             </button>
          </div>
        </div>

        <div className="relative z-10 space-y-10 py-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-amber-500 rounded-2xl shadow-xl shadow-amber-500/20 animate-float">
                <HardHat size={28} className="text-black" />
              </div>
              <div className={`h-6 w-px rotate-12 mx-1 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
              <h1 className={`text-2xl font-black uppercase tracking-tighter italic ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>QS Vault</h1>
            </div>
            
            <h2 className={`text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-[0.9] italic ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              Precision Takeoff<br />
              <span className="text-amber-500 underline decoration-amber-500/20 underline-offset-8">Starts Here.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 max-w-lg">
            <FeatureItem icon={Zap} title="Millimetric Precision" description="Digital takeoff tools optimized for field tablets." theme={theme} />
            <FeatureItem icon={ShieldCheck} title="Local SMM Sync" description="Fully compliant with regional construction standards." theme={theme} />
            <FeatureItem icon={Database} title="Secure Data Vault" description="AES-256 encryption for all project measurements." theme={theme} />
          </div>

          <div className={`p-6 rounded-4xl font-mono text-[10px] space-y-1.5 backdrop-blur-md border transition-all duration-500 max-w-sm
            ${theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800/50 hover:border-amber-500/30' : 'bg-zinc-50 border-zinc-200 hover:border-amber-500/40'}`}>
            <p className="text-zinc-600">// Vault Handshake Logic</p>
            <p className="text-zinc-400"><span className="text-amber-500">const</span> <span className="text-blue-400">unlock</span> = (id) =&gt; &#123;</p>
            <p className="text-zinc-400">&nbsp;&nbsp;<span className="text-amber-500">if</span> (!id.valid) <span className="text-red-500">throw</span> Error(<span className="text-emerald-500">"LOCK"</span>);</p>
            <p className="text-zinc-400">&nbsp;&nbsp;<span className="text-blue-400">Vault</span>.initialize();</p>
            <p className="text-zinc-400">&#125;;</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between opacity-50 pb-2">
           <div className="flex items-center gap-4">
             <Ruler size={14} className="text-amber-500 animate-slide-slow" />
             <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">SYSTEM / QS-PV2.0</p>
           </div>
           <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-amber-500/10 transition-colors">
             {theme === 'dark' ? <Sun size={12} className="text-zinc-500" /> : <Moon size={12} className="text-zinc-500" />}
           </button>
        </div>
      </div>

      {/* 2. RIGHT SECTION: AUTH FORM (Laptop-height optimized) */}
      <div className={`flex-1 p-6 md:p-12 lg:p-16 flex items-center justify-center relative bg-zinc-950/5 h-full
        ${mobileView === 'form' ? 'flex' : 'hidden lg:flex'}`}>
        
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{backgroundImage: 'radial-gradient(#f59e0b 0.5px, transparent 0.5px)', backgroundSize: '32px 32px'}} />

        <div className="w-full max-w-lg relative z-10">
          <div className={`backdrop-blur-3xl p-8 md:p-12 rounded-[3.5rem] border shadow-2xl space-y-8 transition-all 
            ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800/60 shadow-black/40' : 'bg-white/80 border-zinc-200'}`}>
            
            <div className="flex justify-between items-start">
               <div className="space-y-2">
                 <h3 className={`text-3xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                   {isRegistering ? 'Register' : 'Identity'}<span className="text-amber-500 italic">.</span>
                 </h3>
                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                   {isRegistering ? 'Initialize your project node.' : 'Unlock your project vault.'}
                 </p>
               </div>
               <button onClick={() => setMobileView('branding')} className="lg:hidden p-2 rounded-full bg-zinc-500/10 text-zinc-500">
                  <Info size={18} />
               </button>
            </div>

            {authStatus.message && (
              <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border animate-in zoom-in-95 
                ${authStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                {authStatus.type === 'success' ? <CheckCircle size={14} /> : <X size={14} />}
                <span className="flex-1 leading-tight">{authStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-5">
              {isRegistering && (
                <div className="space-y-2 text-left">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-3 italic">Username</label>
                  <div className="relative group">
                    <User size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                    <input 
                      type="text" required value={username} onChange={(e) => setUsername(e.target.value)} 
                      placeholder="surveyor_01" 
                      className={`w-full pl-14 pr-6 py-4 rounded-2xl text-xs font-bold border outline-none transition-all focus:ring-4 ring-amber-500/10
                        ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800 text-white placeholder-zinc-800' : 'bg-zinc-50 border-zinc-200'}`} 
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 text-left">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-3 italic">Vault Email</label>
                <div className="relative group">
                  <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                  <input 
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)} 
                    placeholder="surveyor@vault.co" 
                    className={`w-full pl-14 pr-6 py-4 rounded-2xl text-xs font-bold border outline-none transition-all focus:ring-4 ring-amber-500/10
                      ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800 text-white placeholder-zinc-800' : 'bg-zinc-50 border-zinc-200'}`} 
                  />
                </div>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-3 italic">Access Key</label>
                <div className="relative group">
                  <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                  <input 
                    type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    className={`w-full pl-14 pr-14 py-4 rounded-2xl text-xs font-bold border outline-none transition-all focus:ring-4 ring-amber-500/10
                      ${theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800 text-white placeholder-zinc-800' : 'bg-zinc-50 border-zinc-200'}`} 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-amber-500">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Synchronizing..." : isRegistering ? "Initialize Project Node" : "Unlock Vault Session"}
              </Button>
            </form>

            <div className="text-center">
               <button 
                onClick={() => { setIsRegistering(!isRegistering); setAuthStatus({message: null, type: 'success'}); }}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-amber-500 transition-colors"
               >
                 {isRegistering ? "Back to Vault Authorization" : "Initialize New Node (Register)"}
               </button>
            </div>

            <div className="relative flex items-center py-1">
              <div className={`grow h-px ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
              <span className="shrink mx-4 text-[8px] font-black uppercase tracking-[0.3em] text-zinc-500">Cloud Identity</span>
              <div className={`grow h-px ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
            </div>

            <Button onClick={handleGoogleLogin} variant="secondary" className="w-full gap-4 py-4">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.94 0 3.51.68 4.75 1.81l3.5-3.5C18.1 1.42 15.29 0 12 0 7.31 0 3.25 2.69 1.24 6.62l4.08 3.16C6.29 7.3 8.93 5.04 12 5.04z" />
                <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.89 3c2.28-2.1 3.53-5.2 3.53-8.82z" />
                <path fill="#FBBC05" d="M5.32 14.22c-.24-.73-.38-1.5-.38-2.22s.14-1.49.38-2.22L1.24 6.62C.45 8.18 0 9.94 0 12c0 2.06.45 3.82 1.24 5.38l4.08-3.16z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.89-3c-1.11.75-2.53 1.19-4.04 1.19-3.07 0-5.71-2.26-6.68-5.34l-4.08 3.16C3.25 21.31 7.31 24 12 24z" />
              </svg>
              Google Identity Bridge
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes slide-slow { 0%, 100% { transform: translateX(0); opacity: 0.3; } 50% { transform: translateX(6px); opacity: 0.7; } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-slide-slow { animation: slide-slow 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default LoginPage;