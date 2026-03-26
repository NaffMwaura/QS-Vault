/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { type Session, type User, type AuthChangeEvent } from "@supabase/supabase-js";

/** --- TYPES & INTERFACES --- **/

export type Theme = "light" | "dark";
export type UserRole = 'user' | 'editor' | 'admin' | 'super-admin';
export type DashboardView = 'projects' | 'rates' | 'settings' | 'profile' | 'diary' | 'resources' | 'collab';

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isOnline: boolean;
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)";

const getSystemTheme = (): Theme => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "dark";
  }

  return window.matchMedia(SYSTEM_THEME_QUERY).matches ? "dark" : "light";
};

/* ======================================================
    SYSTEM INITIALIZATION
   ====================================================== */

let supabase: any = null;
let db: any = null;

const initializeSystem = async () => {
  try {
    const dbMod = await import("../../lib/database/database");
    if (dbMod.supabase) supabase = dbMod.supabase;
    if (dbMod.db) db = dbMod.db;
  } catch (e) {
    console.warn("Vault Security: Establishing local node connection...");
  }
};

const SESSION_EXPIRY_MS = 12 * 60 * 60 * 1000; // 12 Hours

/** --- UI: HIGH-PRECISION LOADING WORKSPACE --- **/

const LoadingWorkspace = () => (
  <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center">
    <div className="relative w-32 h-32 mb-12">
      <div className="absolute inset-0 border-4 border-zinc-900 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-[spin_2s_linear_infinite]"></div>
      <div className="absolute inset-4 border-2 border-zinc-800 rounded-full"></div>
      <div className="absolute inset-4 border-2 border-amber-400 rounded-full border-b-transparent animate-[spin_3s_linear_infinite_reverse]"></div>
      <div className="absolute inset-10 border border-amber-500/20 rounded-full animate-pulse shadow-[0_0_30px_rgba(245,158,11,0.15)]"></div>
    </div>
    
    <div className="space-y-3">
      <h2 className="text-amber-500 font-black uppercase tracking-[0.6em] text-lg italic leading-none">
        QS VAULT
      </h2>
      <div className="flex items-center justify-center gap-2">
         <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.3s]" />
         <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.15s]" />
         <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
      </div>
      <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.4em] italic">
        Authorized Access Only • Preparing Nodes
      </p>
    </div>
  </div>
);

/** --- PROVIDER IMPLEMENTATION --- **/

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  
  const [activeView, setActiveView] = useState<DashboardView>(() => {
    if (typeof window === 'undefined') return 'projects';
    return (localStorage.getItem("qs_active_view") as DashboardView) || 'projects';
  });

  const [theme, setTheme] = useState<Theme>(getSystemTheme);

  /* --------------------------------------------------
      CORE ACTIONS: IMMEDIATE RESPONSE SIGN-OUT
     -------------------------------------------------- */

  const signOut = useCallback(async () => {
    // 1. OPTIMISTIC CLEAR: We kill the UI state immediately so user sees "Login" right away
    setSession(null);
    setUser(null);
    setRole(null);
    localStorage.removeItem("qs_login_timestamp");

    // 2. BACKGROUND CLEANUP: Let Supabase handle the cloud token in the background
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn("Auth: Cloud sign-out background task deferred (Offline).");
      }
    }
  }, []);

  // 1. Connectivity Check
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

  // 2. Role Fetcher (With Offline Cache Support)
  const resolveUserRole = useCallback(async (userId: string): Promise<UserRole> => {
    if (isOnline && supabase) {
      try {
        const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
        if (data?.role) {
          if (db) await db.profiles.put({ id: userId, role: data.role, updated_at: new Date().toISOString() });
          return data.role as UserRole;
        }
      } catch (e) { /* Local fallback */ }
    }

    if (db) {
      const localProfile = await db.profiles.get(userId);
      if (localProfile?.role) return localProfile.role as UserRole;
    }

    return 'user';
  }, [isOnline]);

  // 3. Security: Check Session Expiry (12 Hour Limit)
  const checkSessionSecurity = useCallback(() => {
    const loginTime = localStorage.getItem("qs_login_timestamp");
    if (loginTime) {
      const elapsed = Date.now() - parseInt(loginTime);
      if (elapsed > SESSION_EXPIRY_MS) {
        console.warn("Security: Session expired. Enforcing Re-authentication.");
        signOut();
        return false;
      }
    }
    return true;
  }, [signOut]);

  // 4. Initialization Handshake
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      await initializeSystem();
      
      if (!mounted) return;
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      // Check for current session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession && checkSessionSecurity()) {
        setSession(currentSession);
        setUser(currentSession.user);
        const userRole = await resolveUserRole(currentSession.user.id);
        if (mounted) setRole(userRole);
      } else if (!currentSession) {
        // If no cloud session exists, we ensure local state is clean
        setSession(null);
        setUser(null);
      }

      // Sync logins/logouts via Supabase Listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, newSession: Session | null) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          if (!localStorage.getItem("qs_login_timestamp")) {
            localStorage.setItem("qs_login_timestamp", Date.now().toString());
          }
          setSession(newSession);
          setUser(newSession?.user ?? null);
          if (newSession?.user) {
            const r = await resolveUserRole(newSession.user.id);
            if (mounted) setRole(r);
          }
        } else if (event === 'SIGNED_OUT') {
          // Trigger the immediate state clear if not already cleared
          signOut();
        }

        setIsLoading(false);
      });

      setIsLoading(false);

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    };

    initializeAuth();
  }, [resolveUserRole, checkSessionSecurity, signOut]);

  // 5. Persistence Handlers
  useEffect(() => {
    localStorage.setItem("qs_active_view", activeView);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }, [activeView, theme]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia(SYSTEM_THEME_QUERY);
    const syncTheme = (event?: MediaQueryListEvent) => {
      setTheme(event?.matches ?? mediaQuery.matches ? "dark" : "light");
    };

    syncTheme();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncTheme);

      return () => {
        mediaQuery.removeEventListener("change", syncTheme);
      };
    }

    mediaQuery.addListener(syncTheme);

    return () => {
      mediaQuery.removeListener(syncTheme);
    };
  }, []);

  const value = useMemo(() => ({ 
    session, user, role, isLoading, signOut, 
    theme, setTheme, toggleTheme: () => setTheme(t => t === 'light' ? 'dark' : 'light'), 
    isOnline, activeView, setActiveView
  }), [session, user, role, isLoading, theme, isOnline, activeView, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? <LoadingWorkspace /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
