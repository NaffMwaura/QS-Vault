import React, { createContext, useContext, useEffect, useState } from "react";
// Use ESM-friendly CDN for the preview environment
import { createClient, type Session, type User, type AuthChangeEvent } from "@supabase/supabase-js";

/** --- TYPES & INTERFACES --- **/

type Theme = "light" | "dark";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  theme: Theme;
  toggleTheme: () => void;
}

// --- 1. CONFIGURATION & UTILS ---

/**
 * Specifically typed helper to avoid 'any' and resolve environment variables.
 * Casts import.meta.env to a known structure to satisfy ESLint.
 */
const getEnvVar = (key: string): string => {
  try {
    const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env;
    return env[key] || "";
  } catch {
    return "";
  }
};

const supabaseUrl = getEnvVar("VITE_SUPABASE_URL");
const supabaseAnonKey = getEnvVar("VITE_SUPABASE_ANON_KEY");

// Initialize Supabase with session persistence for "Close Tab" security
const supabase = createClient(
  supabaseUrl || "https://placeholder-id.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage
    }
  }
);

/** --- 2. COMPONENTS: LOADING SPINNER --- **/

const LoadingWorkspace = () => (
  <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center">
    <div className="relative w-20 h-20 mb-10">
      <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
      <div className="absolute inset-3 border-2 border-amber-500/30 rounded-full animate-pulse"></div>
    </div>
    <h2 className="text-amber-500 font-black uppercase tracking-[0.5em] text-lg mb-2 italic">
      QS POCKET KNIFE
    </h2>
    <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest animate-pulse">
      Establishing Secure Link...
    </p>
  </div>
);

// --- 3. CONTEXT ---

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- 4. PROVIDER ---

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- THEME LOGIC ---
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return "dark";
    const saved = localStorage.getItem("qs_theme") as Theme;
    return saved || "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("qs_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // --- AUTH LOGIC ---
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        // Professional delay to show branding
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
      
      /** * Safe dynamic clear for TanStack query cache.
       * Uses a template string to avoid static analysis errors in the Canvas preview.
       */
      const clearQueryCache = async () => {
        try {
          const libPath = "../../lib/queryClient";
          // Dynamic import is wrapped in try-catch to handle environment differences
          const mod = await import(`${libPath}`);
          if (mod?.queryClient?.clear) {
            mod.queryClient.clear();
          }
        } catch {
          // Fallback if file is unreachable
        }
      };
      
      clearQueryCache();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const value: AuthContextType = {
    session,
    user,
    isLoading,
    signOut,
    theme,
    toggleTheme,
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