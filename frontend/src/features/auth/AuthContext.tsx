/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { type Session, type User, type AuthChangeEvent } from "@supabase/supabase-js";

/** --- TYPES & INTERFACES --- **/

export type Theme = "light" | "dark";
export type UserRole = 'user' | 'editor' | 'admin' | 'super-admin';
export type DashboardView = 'projects' | 'rates' | 'settings' | 'profile';

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  theme: Theme;
  toggleTheme: () => void;
  isOnline: boolean;
  /** * Master View Control:
   * This state orchestrates the view between the AppShell sidebar
   * and the Dashboard content area.
   */
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ======================================================
    SUPABASE CLIENT INITIALIZATION
   ====================================================== */

let supabase: any = null;

const initializeSupabase = async () => {
  try {
    // Dynamic import to support both Sandbox and Local environments
    const mod = await import("../../lib/database/database");
    if (mod.supabase) supabase = mod.supabase;
  } catch (e) {
    console.warn("Office Security: Connection to database pending...");
  }
};

/** --- UI COMPONENTS: LOADING --- **/

const LoadingWorkspace = () => (
  <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center">
    <div className="relative w-24 h-24 mb-10">
      {/* Outer Decorative Ring */}
      <div className="absolute inset-0 border-4 border-zinc-900 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-[spin_3s_linear_infinite]"></div>
      
      {/* Precision Measuring Ring */}
      <div className="absolute inset-4 border-2 border-zinc-800 rounded-full"></div>
      <div className="absolute inset-4 border-2 border-amber-400 rounded-full border-b-transparent animate-[spin_2s_linear_infinite_reverse]"></div>
      
      {/* Core Heartbeat Pulse */}
      <div className="absolute inset-8 border border-amber-500/10 rounded-full animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.2)]"></div>
    </div>
    <div className="space-y-2">
      <h2 className="text-amber-500 font-black uppercase tracking-[0.5em] text-lg italic leading-none">
        QS POCKET KNIFE
      </h2>
      <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest animate-pulse italic">
        Preparing your office workspace...
      </p>
    </div>
  </div>
);

/** --- CONTEXT PROVIDER --- **/

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  
  // Master Navigation State
  const [activeView, setActiveView] = useState<DashboardView>(() => {
    if (typeof window === 'undefined') return 'projects';
    return (localStorage.getItem("qs_active_view") as DashboardView) || 'projects';
  });

  // Theme Management
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return "dark";
    return (localStorage.getItem("qs_theme") as Theme) || "dark";
  });

  // 1. Persist Navigation View
  useEffect(() => {
    localStorage.setItem("qs_active_view", activeView);
  }, [activeView]);

  // 2. Connectivity Listener
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

  // 3. Theme Sync
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("qs_theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  // 4. Optimized Role Fetcher
  const fetchUserRole = useCallback(async (userId: string): Promise<UserRole> => {
    if (!supabase) return 'user';
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        return 'user'; 
      }
      return (data?.role as UserRole) || 'user';
    } catch (e) {
      return 'user';
    }
  }, []);

  // 5. Main Authentication Process
  useEffect(() => {
    let mounted = true;

    const startAuthProcess = async () => {
      await initializeSupabase();
      
      if (!supabase) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
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
        console.error("Office Security: Connection Failure", err);
      } finally {
        if (mounted) setIsLoading(false);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, currentSession: Session | null) => {
        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          const userRole = await fetchUserRole(currentSession.user.id);
          if (mounted) setRole(userRole);
        } else {
          setRole(null);
          setActiveView('projects'); // Reset view on logout
        }
        
        setIsLoading(false);
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    };

    startAuthProcess();
  }, [fetchUserRole]);

  /** * REFINED SIGN OUT
   * We remove the hard page reload (window.location.href) to allow
   * React Router to handle the transition smoothly.
   */
  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      // The onAuthStateChange listener above will trigger and set user to null,
      // which causes the App.tsx router to automatically show the login page.
    }
  };

  const value = useMemo(() => ({ 
    session, 
    user, 
    role, 
    isLoading, 
    signOut, 
    theme, 
    toggleTheme, 
    isOnline,
    activeView, 
    setActiveView
  }), [session, user, role, isLoading, theme, isOnline, activeView]);

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