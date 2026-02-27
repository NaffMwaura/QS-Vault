import React, { createContext, useContext, useEffect, useState } from "react";
// Import types from the ESM-friendly CDN for the preview environment
import { type Session, type User, type AuthChangeEvent } from "@supabase/supabase-js";

/** --- TYPES & INTERFACES --- **/

type Theme = "light" | "dark";
export type UserRole = 'user' | 'editor' | 'admin' | 'super-admin';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  theme: Theme;
  toggleTheme: () => void;
  isOnline: boolean;
}

/** * SupabaseAuthInstance
 * Resolved: Simplified the interface to break the 'excessively deep' type instantiation loop.
 * By using 'any' for the Postgrest chain return types, we prevent the compiler from 
 * infinitely recursing into Supabase's internal generic structures.
 */
interface SupabaseAuthInstance {
  auth: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getSession: () => Promise<{ data: { session: Session | null }; error: any }>;
    onAuthStateChange: (callback: (event: AuthChangeEvent, session: Session | null) => void) => { 
      data: { subscription: { unsubscribe: () => void } } 
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signOut: () => Promise<{ error: any }>;
  };
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        single: () => Promise<any>; // Use any here to break recursion ts(2589)
      };
    };
  };
}

/** --- MODULE RESOLUTION HANDLER --- **/
let supabase: SupabaseAuthInstance | null = null;

const initializeSupabase = async () => {
  try {
    const mod = await import("../../lib/database/database");
    if (mod.supabase) {
      // Cast to any during assignment to resolve ts(2322) mismatch
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase = mod.supabase as any;
    }
  } catch {
    console.warn("Vault Sync: Centralized client resolution pending...");
  }
};

/** --- UI COMPONENTS: LOADING --- **/

const LoadingWorkspace = () => (
  <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center">
    <div className="relative w-20 h-20 mb-10">
      <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
      <div className="absolute inset-3 border-2 border-amber-500/30 rounded-full animate-pulse"></div>
    </div>
    <div className="space-y-2">
      <h2 className="text-amber-500 font-black uppercase tracking-[0.5em] text-lg italic">
        QS POCKET KNIFE
      </h2>
      <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest animate-pulse italic">
        Securing Workspace...
      </p>
    </div>
  </div>
);

// --- CONTEXT INITIALIZATION ---

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

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

  /** --- FETCH ROLE HELPER --- **/
  const fetchUserRole = async (userId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setRole(data.role as UserRole);
      }
    } catch (e) {
      console.error("Error fetching role:", e);
    }
  };

  // --- AUTH INITIALIZATION ---
  useEffect(() => {
    const startAuthHandshake = async () => {
      if (!supabase) await initializeSupabase();
      if (!supabase) return;

      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (initialSession?.user) {
          await fetchUserRole(initialSession.user.id);
        }
      } catch (err) {
        console.error("Vault Access Error:", err);
      } finally {
        setTimeout(() => setIsLoading(false), 600);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          await fetchUserRole(currentSession.user.id);
        } else {
          setRole(null);
        }
        
        setIsLoading(false);
      });

      return () => subscription.unsubscribe();
    };

    startAuthHandshake();
  }, []);

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      
      try {
        import("../../lib/queryClient").then(mod => {
          if (mod.queryClient) mod.queryClient.clear();
        }).catch(() => {});
      } catch {
        /* No-op */
      }

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

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};