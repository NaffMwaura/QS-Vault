import React, { useState } from 'react';
import { Mail, CheckCircle, X } from 'lucide-react';
// Corrected the path to ensure it maps correctly to your project structure
import { supabase } from "../../lib/database/database"; 

/* --- Simple UI Components --- */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, className, ...props }) => (
  <button 
    {...props} 
    className={`disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center ${className}`}
  >
    {children}
  </button>
);

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
  const [authStatus, setAuthStatus] = useState<{ message: string | null; type: 'success' | 'error' }>({ message: null, type: 'success' });

  // Handle Magic Link Submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setAuthStatus({ message: null, type: 'success' });

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // This ensures the user is redirected back to the dashboard upon clicking the link
          emailRedirectTo: window.location.origin + '/dashboard',
        },
      });

      if (error) throw error;

      setAuthStatus({ 
        message: "Magic Link Transmitted! Check your inbox.", 
        type: 'success' 
      });
    } catch (error: any) {
      setAuthStatus({ 
        message: error.message || "Failed to send link. Please try again.", 
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
    } catch (error: any) {
      setAuthStatus({ message: error.message, type: 'error' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] p-4 font-sans">
      <div className="w-full max-w-md bg-zinc-900/40 p-10 rounded-[2.5rem] shadow-[0_0_60px_rgba(245,158,11,0.1)] space-y-8 border border-zinc-800/50 backdrop-blur-xl">
        
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-black text-amber-500 tracking-tighter uppercase italic leading-none">QS Pocket Knife</h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Precision Takeoff <span className="text-zinc-700">•</span> Offline Vault</p>
        </div>

        <AuthMessage message={authStatus.message} type={authStatus.type} />

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

          <Button 
            type="submit" 
            disabled={loading || (authStatus.type === 'success' && !!authStatus.message)} 
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-6 rounded-2xl uppercase text-[11px] tracking-[0.2em]"
          >
            {loading ? "Verifying..." : authStatus.message && authStatus.type === 'success' ? "Link Transmitted" : "Authorize Session"}
          </Button>
        </form>

        <div className="relative flex items-center py-2">
          <div className="grow border-t border-zinc-800"></div>
          <span className="shrink mx-4 text-[10px] font-black text-zinc-700 uppercase">OR</span>
          <div className="grow border-t border-zinc-800"></div>
        </div>

        {/* Enhanced Google Button with high-visibility SVG icon */}
        <Button 
          onClick={handleGoogleLogin} 
          className="w-full bg-white hover:bg-zinc-100 text-black font-black py-6 rounded-2xl flex items-center justify-center gap-3 uppercase text-[11px] tracking-[0.2em] shadow-lg border border-zinc-200"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.94 0 3.51.68 4.75 1.81l3.5-3.5C18.1 1.42 15.29 0 12 0 7.31 0 3.25 2.69 1.24 6.62l4.08 3.16C6.29 7.3 8.93 5.04 12 5.04z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.89 3c2.28-2.1 3.53-5.2 3.53-8.82z"
            />
            <path
              fill="#FBBC05"
              d="M5.32 14.22c-.24-.73-.38-1.5-.38-2.22s.14-1.49.38-2.22L1.24 6.62C.45 8.18 0 9.94 0 12c0 2.06.45 3.82 1.24 5.38l4.08-3.16z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.89-3c-1.11.75-2.53 1.19-4.04 1.19-3.07 0-5.71-2.26-6.68-5.34l-4.08 3.16C3.25 21.31 7.31 24 12 24z"
            />
          </svg>
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