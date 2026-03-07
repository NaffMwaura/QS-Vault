/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { type Session, type User, type AuthChangeEvent } from "@supabase/supabase-js";

/** --- TYPES & INTERFACES --- **/

export type Theme = "light" | "dark";
export type UserRole = 'user' | 'editor' | 'admin' | 'super-admin';

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  theme: Theme;
  toggleTheme: () => void;
  isOnline: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** --- MODULE RESOLUTION --- **/

let supabase: any = null;

const initializeSupabase = async () => {
  try {
    // @ts-ignore - Dynamic resolution for local project paths
    const mod = await import("../../lib/database/database");
    if (mod.supabase) {
      supabase = mod.supabase;
    }
  } catch (e) {
    console.warn("Vault Handshake: Database client resolution pending...");
  }
};

/** --- UI COMPONENTS: LOADING --- **/

const LoadingWorkspace = () => (
  <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center">
    <div className="relative w-24 h-24 mb-10">
      <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
      <div className="absolute inset-4 border-2 border-amber-500/30 rounded-full animate-pulse"></div>
    </div>
    <div className="space-y-2">
      <h2 className="text-amber-500 font-black uppercase tracking-[0.5em] text-lg italic leading-none">
        QS POCKET KNIFE
      </h2>
      <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest animate-pulse italic">
        Securing Workspace Node...
      </p>
    </div>
  </div>
);

// --- CONTEXT PROVIDER ---

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // 1. Connectivity Listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 2. Theme Management
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return "dark";
    return (localStorage.getItem("qs_theme") as Theme) || "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("qs_theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  // 3. Optimized Role Fetcher
  const fetchUserRole = useCallback(async (userId: string): Promise<UserRole> => {
    if (!supabase) return 'user';
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle(); // Safer than .single() to avoid 406 errors
      
      if (error) {
        // Logs recursion only if the DB is still misconfigured
        if (error.message.includes("recursion")) {
          console.error("Critical: Database RLS recursion still exists.");
        }
        return 'user'; 
      }
      return (data?.role as UserRole) || 'user';
    } catch (e) {
      return 'user';
    }
  }, []);

  // 4. Main Auth Handshake
  useEffect(() => {
    let mounted = true;

    const startAuthHandshake = async () => {
      if (!supabase) await initializeSupabase();
      
      if (!supabase) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          if (initialSession?.user) {
            const userRole = await fetchUserRole(initialSession.user.id);
            if (mounted) setRole(userRole);
          }
        }
      } catch (err) {
        console.error("Vault Access Failure:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }

      // Listen for changes (Sign in, Sign out, Token Refresh)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, currentSession: Session | null) => {
        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          const userRole = await fetchUserRole(currentSession.user.id);
          if (mounted) setRole(userRole);
        } else {
          setRole(null);
        }
        
        setIsLoading(false);
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    };

    startAuthHandshake();
  }, [fetchUserRole]);

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      window.location.href = '/';
    }
  };

  const value: AuthContextType = {
    session,
    user,
    role,
    isLoading,
    signOut,
    theme,
    toggleTheme,
    isOnline,
  };

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? <LoadingWorkspace /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};