import React, { useState } from 'react';
import { Mail, CheckCircle, X, HardHat, ShieldCheck, Zap, Database, ArrowLeft, Ruler } from 'lucide-react';
// Corrected the path to ensure it maps correctly to your project structure
import { supabase } from "../../lib/database/database"; 

/** --- TYPES & INTERFACES --- **/

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

interface AuthStatus {
  message: string | null;
  type: 'success' | 'error';
}

interface FeatureItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

/** --- UI COMPONENTS --- **/

const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => (
  <button 
    {...props} 
    className={`disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center font-black uppercase text-[11px] tracking-[0.2em] rounded-2xl ${className}`}
  >
    {children}
  </button>
);

const FeatureItem: React.FC<FeatureItemProps> = ({ icon: Icon, title, description }) => (
  <div className="flex items-start gap-4 group">
    <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500 group-hover:scale-110 transition-transform">
      <Icon size={18} />
    </div>
    <div>
      <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-200">{title}</h4>
      <p className="text-[10px] text-zinc-500 font-bold leading-relaxed">{description}</p>
    </div>
  </div>
);

/** --- MAIN LOGIN PAGE --- **/

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ message: null, type: 'success' });

  // Handle Magic Link Submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setAuthStatus({ message: null, type: 'success' });

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + '/dashboard',
        },
      });

      if (error) throw error;

      setAuthStatus({ 
        message: "Magic Link Transmitted! Check your inbox.", 
        type: 'success' 
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to transmit authorization link.";
      setAuthStatus({ 
        message: errorMessage, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Google OAuth
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard',
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Google authentication failed.";
      setAuthStatus({ message: errorMessage, type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col lg:flex-row font-sans selection:bg-amber-500/30 overflow-x-hidden">
      
      {/* 1. LEFT SECTION: BRANDING & FEATURES */}
      <div className="relative flex-1 p-8 md:p-16 lg:p-24 flex flex-col justify-between overflow-hidden lg:min-h-screen border-r border-zinc-800/20">
        {/* Animated Background Blur */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-amber-500/5 rounded-full blur-[120px] animate-pulse" />
        
        {/* Navigation */}
        <button 
          onClick={() => window.location.href = '/'} 
          className="relative z-10 flex items-center gap-2 text-zinc-600 hover:text-amber-500 transition-colors font-black uppercase text-[10px] tracking-[0.2em] group w-fit"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Overview
        </button>

        {/* Content */}
        <div className="relative z-10 space-y-12 py-12">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500 rounded-2xl shadow-2xl shadow-amber-500/20 animate-float">
                <HardHat size={32} className="text-black" />
              </div>
              <div className="h-8 w-[1px] bg-zinc-800 rotate-12 mx-2" />
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">QS Vault</h1>
            </div>
            
            <h2 className="text-5xl md:text-6xl lg:text-8xl font-black text-white uppercase tracking-tighter leading-[0.85] italic">
              Precision Takeoff<br />
              <span className="text-amber-500">Starts Here.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-8 max-w-2xl">
            <FeatureItem 
              icon={Zap} 
              title="Instant Digital Takeoffs" 
              description="Calculate areas, lengths, and counts with millimetric precision directly in your workspace."
            />
            <FeatureItem 
              icon={ShieldCheck} 
              title="Offline-First Vault" 
              description="Work at remote sites with zero connectivity. Syncing happens automatically upon reconnection."
            />
            <FeatureItem 
              icon={Database} 
              title="Centralized Library" 
              description="A secure repository for blueprints and BOQ items, encrypted with enterprise-grade standards."
            />
          </div>

          {/* "Funny" Code Snippet Illustration */}
          <div className="p-8 bg-zinc-950/40 border border-zinc-800/50 rounded-3xl font-mono text-[11px] space-y-2 backdrop-blur-md hidden md:block group hover:border-amber-500/30 transition-all duration-500 max-w-lg">
            <div className="flex gap-1.5 mb-4">
               <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
               <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20" />
               <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20" />
            </div>
            <p className="text-zinc-600">// Measurement Intelligence v2.4.0</p>
            <p className="text-zinc-400"><span className="text-amber-500">const</span> <span className="text-blue-400">verifyEstimate</span> = (items) =&gt; &#123;</p>
            <p className="text-zinc-400">&nbsp;&nbsp;<span className="text-amber-500">if</span> (user.needsCoffee) <span className="text-amber-500">throw</span> <span className="text-green-400">"NapError"</span>;</p>
            <p className="text-zinc-400">&nbsp;&nbsp;<span className="text-amber-500">return</span> items.reduce((acc, i) =&gt; acc + i.qty, <span className="text-blue-400">0</span>);</p>
            <p className="text-zinc-400">&#125;;</p>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="relative z-10 flex items-center gap-4 opacity-40">
           <Ruler size={16} className="text-amber-500 animate-slide-slow" />
           <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">
             QS POCKET KNIFE / SECURE ACCESS GATEWAY
           </p>
        </div>
      </div>

      {/* 2. RIGHT SECTION: LOGIN FORM (BALANCED 50/50) */}
      <div className="flex-1 p-6 md:p-12 lg:p-24 flex items-center justify-center relative bg-zinc-950/20">
        {/* Background Mesh Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{backgroundImage: 'radial-gradient(#f59e0b 0.5px, transparent 0.5px)', backgroundSize: '40px 40px'}} />

        <div className="w-full max-w-xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="bg-zinc-900/40 backdrop-blur-3xl p-10 md:p-16 rounded-[3.5rem] border border-zinc-800/60 shadow-[0_0_100px_rgba(0,0,0,0.4)] space-y-12 transition-all hover:border-zinc-700/50">
            
            <div className="space-y-3">
              <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Identity<span className="text-amber-500 italic">.</span></h3>
              <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] leading-relaxed max-w-sm">
                Unlock your workspace and synchronize project data with the central node.
              </p>
            </div>

            {authStatus.message && (
              <div className={`p-5 rounded-[2rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-4 border animate-in zoom-in-95 ${
                authStatus.type === 'success' 
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                  : 'bg-red-500/10 text-red-500 border-red-500/20'
              }`}>
                <div className={`p-1.5 rounded-full ${authStatus.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                  {authStatus.type === 'success' ? <CheckCircle size={14} /> : <X size={14} />}
                </div>
                {authStatus.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-3">Vault Authentication (Email)</label>
                <div className="relative group">
                  <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                  <input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} 
                    placeholder="surveyor@vault.gov" 
                    className="w-full pl-16 pr-8 py-6 bg-zinc-950/60 border border-zinc-800 rounded-3xl text-sm font-bold text-white placeholder-zinc-800 outline-none focus:ring-4 ring-amber-500/10 transition-all focus:border-amber-500/40" 
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading || (authStatus.type === 'success' && !!authStatus.message)} 
                className="w-full bg-amber-500 hover:bg-amber-400 text-black py-7 shadow-2xl shadow-amber-500/20 group relative overflow-hidden"
              >
                <span className="relative z-10">
                  {loading ? "Verifying Vault Credentials..." : authStatus.message && authStatus.type === 'success' ? "Authorization Link Sent" : "Authorize Session"}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </Button>
            </form>

            <div className="relative flex items-center">
              <div className="grow h-[1px] bg-zinc-800/50"></div>
              <span className="shrink mx-6 text-[12px] font-black text-amber-400 uppercase tracking-[0.6em]">OR ACCESS VIA</span>
              <div className="grow h-[1px] bg-zinc-800/50"></div>
            </div>

            <Button 
              onClick={handleGoogleLogin} 
              className="w-full bg-white hover:bg-zinc-50 text-black py-7 shadow-xl border border-zinc-200 group"
            >
              <svg className="w-5 h-5 mr-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.94 0 3.51.68 4.75 1.81l3.5-3.5C18.1 1.42 15.29 0 12 0 7.31 0 3.25 2.69 1.24 6.62l4.08 3.16C6.29 7.3 8.93 5.04 12 5.04z" />
                <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.89 3c2.28-2.1 3.53-5.2 3.53-8.82z" />
                <path fill="#FBBC05" d="M5.32 14.22c-.24-.73-.38-1.5-.38-2.22s.14-1.49.38-2.22L1.24 6.62C.45 8.18 0 9.94 0 12c0 2.06.45 3.82 1.24 5.38l4.08-3.16z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.89-3c-1.11.75-2.53 1.19-4.04 1.19-3.07 0-5.71-2.26-6.68-5.34l-4.08 3.16C3.25 21.31 7.31 24 12 24z" />
              </svg>
              Google Workspace
            </Button>

            <div className="flex justify-center items-center gap-3 pt-6 group">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse group-hover:scale-150 transition-transform" />
              <p className="text-[9px] font-black uppercase text-zinc-700 tracking-widest leading-none">Quantum Encryption Enabled</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(3deg); }
        }
        @keyframes slide-slow {
          0% { transform: translateX(0); opacity: 0.2; }
          50% { transform: translateX(10px); opacity: 0.8; }
          100% { transform: translateX(0); opacity: 0.2; }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
        .animate-slide-slow {
          animation: slide-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;