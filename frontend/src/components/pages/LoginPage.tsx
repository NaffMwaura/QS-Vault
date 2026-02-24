import React, { useState } from 'react';
import { Mail, CheckCircle, X, Chrome } from 'lucide-react';

/* --- Simple UI Components --- */

// Fixes Error 1 & 2: Added interface for Button Props
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => (
  <button {...props} className={`disabled:opacity-50 transition-all active:scale-[0.98] ${className}`}>
    {children}
  </button>
);

// Fixes Error 3 & 4: Added interface for AuthMessage Props
interface AuthMessageProps {
  message: string | null;
  type: 'success' | 'error';
}

const AuthMessage: React.FC<AuthMessageProps> = ({ message, type }) => {
  if (!message) return null;
  const isSuccess = type === 'success';
  return (
    <div className={`p-4 rounded-xl text-sm font-bold flex items-center space-x-3 border animate-in fade-in zoom-in duration-300 ${isSuccess ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}`}>
      {isSuccess ? <CheckCircle size={18} /> : <X size={18} />}
      <span>{message}</span>
    </div>
  );
};

/* --- Main Page --- */
const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [authSuccess, setAuthSuccess] = useState<boolean>(false);

  // Fixes Error 5: Added React.FormEvent type
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { 
      setLoading(false); 
      setAuthSuccess(true); 
    }, 1500);
  };

  const handleGoogleLogin = () => {
    console.log("Google Login Initiated");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] p-4 font-sans">
      <div className="w-full max-w-md bg-zinc-900/40 p-10 rounded-[2.5rem] shadow-[0_0_60px_rgba(245,158,11,0.1)] space-y-8 border border-zinc-800/50 backdrop-blur-xl">
        
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-black text-amber-500 tracking-tighter uppercase italic leading-none">QS Pocket Knife</h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Precision Takeoff <span className="text-zinc-700">•</span> Offline Vault</p>
        </div>

        <AuthMessage message={authSuccess ? "Magic Link Sent! Check your email." : null} type="success" />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Auth Identifier (Email)</label>
            <div className="relative group">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} 
                placeholder="surveyor@company.com" 
                className="w-full pl-12 pr-4 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm font-bold text-white placeholder-zinc-800 outline-none focus:ring-2 ring-amber-500/30 focus:border-amber-500/50 transition-all" 
              />
            </div>
          </div>

          <Button type="submit" disabled={loading || authSuccess} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-6 rounded-2xl uppercase text-[11px] tracking-[0.2em]">
            {loading ? "Verifying..." : authSuccess ? "Link Transmitted" : "Authorize Session"}
          </Button>
        </form>

        <div className="relative flex items-center py-2">
          <div className="grow border-t border-zinc-800"></div>
          <span className="shrink mx-4 text-[10px] font-black text-zinc-700 uppercase">OR</span>
          <div className="grow border-t border-zinc-800"></div>
        </div>

        <Button onClick={handleGoogleLogin} className="w-full bg-white hover:bg-zinc-200 text-black font-black py-6 rounded-2xl flex items-center justify-center gap-3 uppercase text-[11px] tracking-[0.2em] shadow-lg">
          <Chrome size={18} />
          <span>Continue with Google</span>
        </Button>

        <div className="pt-2 text-center">
          <button type="button" className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-amber-500 transition-all cursor-pointer">
            ← Return to Overview
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;