import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient, type Session, type User, type AuthChangeEvent } from "@supabase/supabase-js";
import { queryClient } from "../../lib/queryClient";

// --- CONFIGURATION & UTILS ---

interface CustomGlobal {
  process?: {
    env?: Record<string, string>;
  };
}

const getSupabaseConfig = () => {
  const globalObj = (typeof window !== 'undefined' ? window : globalThis) as unknown as CustomGlobal;
  const env = globalObj.process?.env || {};
  
  return {
    url: env.VITE_SUPABASE_URL || "",
    key: env.VITE_SUPABASE_ANON_KEY || ""
  };
};

const config = getSupabaseConfig();
const supabase = createClient(config.url, config.key);

// --- TYPES ---

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

// --- COMPONENTS: LOADING SPINNER ---

const LoadingWorkspace = () => (
  <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center">
    {/* Professional Golden Spinner based on QS Pocket Knife Branding */}
    <div className="relative w-16 h-16 mb-8">
      <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
      <div className="absolute inset-2 border-2 border-amber-500/30 rounded-full animate-pulse"></div>
    </div>
    
    <h2 className="text-amber-500 font-black uppercase tracking-[0.4em] text-lg mb-2 italic">
      QS POCKET KNIFE
    </h2>
    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
      Loading Workspace...
    </p>
  </div>
);

// --- CONTEXT ---

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- PROVIDER ---

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        // Slight delay to allow the professional loader to be seen
        setTimeout(() => setIsLoading(false), 800);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, currentSession: Session | null) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // Clear the TanStack Query cache on logout to prevent data leaking between users
      queryClient.clear();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const value = {
    session,
    user,
    isLoading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? <LoadingWorkspace /> : children}
    </AuthContext.Provider>
  );
};

// --- HOOK ---

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};