import React, { useEffect, useState } from 'react';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { LayoutGrid, HardHat, ShieldCheck, LogOut, PlusCircle } from 'lucide-react';

/**
 * IDENTITY VAULT CONFIGURATION
 * These pull from your .env file.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const Login = () => {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) console.error("Vault Access Error:", error.message);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-6 transition-colors duration-300">
      <div className="mb-12 text-center">
        <div className="bg-yellow-400 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-400/20">
          <HardHat size={40} className="text-zinc-900" />
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-100 italic">QS Vault</h1>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">East African Pocket Knife</p>
      </div>

      <div className="w-full max-w-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-sm">
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 py-4 px-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all active:scale-[0.98] text-zinc-900 dark:text-white"
        >
          <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" className="w-5 h-5" />
          Sign in with Google
        </button>

        <div className="mt-8 grid grid-cols-2 gap-4 text-[9px] uppercase tracking-widest text-zinc-400 font-black">
          <div className="flex items-center gap-2"><ShieldCheck size={14} className="text-green-500" /> Offline Sync</div>
          <div className="flex items-center gap-2"><LayoutGrid size={14} className="text-blue-500" /> SMM Rules</div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b]">
      {!session ? (
        <Login />
      ) : (
        <main className="p-8 max-w-5xl mx-auto">
          <header className="flex justify-between items-center mb-16">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter italic text-zinc-900 dark:text-zinc-100">Projects</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{session.user.email}</p>
            </div>
            <button 
              onClick={() => supabase.auth.signOut()}
              className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-2xl text-zinc-400 hover:text-red-500 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </header>

          <div className="text-center p-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem] bg-zinc-50/50 dark:bg-zinc-900/20">
             <div className="bg-zinc-100 dark:bg-zinc-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 text-zinc-300">
                <LayoutGrid size={40} />
             </div>
             <h2 className="text-xl font-black uppercase tracking-tight mb-2">Vault Empty</h2>
             <p className="text-zinc-500 text-sm mb-10 max-w-xs mx-auto">No measurements or projects found. Initialize your first BOQ below.</p>
             <button className="flex items-center gap-3 mx-auto px-10 py-5 bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-black uppercase text-[11px] tracking-[0.2em] rounded-2xl shadow-2xl shadow-yellow-400/30 active:scale-95 transition-all">
               <PlusCircle size={20} />
               New Project
             </button>
          </div>
        </main>
      )}
    </div>
  );
};

export default App;