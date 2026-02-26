import React, { createContext, useContext, useEffect, useState } from "react";
// Use ESM-friendly CDN to ensure the package resolves in this environment
import { createClient, type Session, type User, type AuthChangeEvent } from "@supabase/supabase-js";
import { queryClient } from "../../lib/queryClient";

// --- 1. CONFIGURATION & UTILS ---

/**
 * Helper to safely access environment variables in environments where
 * import.meta might be restricted or empty.
 */
const getEnvVar = (key: string): string => {
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[key]) return metaEnv[key];
  } catch (e) {
    // Silent fallback if import.meta is unavailable
  }
  return "";
};

const getSupabaseConfig = () => {
  return {
    url: getEnvVar("VITE_SUPABASE_URL"),
    key: getEnvVar("VITE_SUPABASE_ANON_KEY")
  };
};

const config = getSupabaseConfig();

/**
 * Initialize Supabase with explicit persistence settings.
 * persistSession: true ensures the token stays in localStorage.
 */
const supabase = createClient(
  config.url || "https://placeholder-id.supabase.co",
  config.key || "placeholder-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage
    }
  }
);

// --- 2. TYPES ---

type Theme = "light" | "dark";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  theme: Theme;
  toggleTheme: () => void;
}

// --- 3. COMPONENTS: LOADING SPINNER ---

const LoadingWorkspace = () => (
  <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 text-center">
    <div className="relative w-16 h-16 mb-8">
      <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
      <div className="absolute inset-2 border-2 border-amber-500/30 rounded-full animate-pulse"></div>
    </div>
    <h2 className="text-amber-500 font-black uppercase tracking-[0.4em] text-lg mb-2 italic">
      QS POCKET KNIFE
    </h2>
    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
      Synchronizing Workspace...
    </p>
  </div>
);

// --- 4. CONTEXT ---

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- 5. PROVIDER ---

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- THEME LOGIC ---
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("qs_theme") as Theme;
    return saved || "dark";
  });

  // Effect to apply theme classes to the root HTML element
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
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
      // Ensure queryClient exists before clearing to avoid runtime errors
      if (queryClient && typeof queryClient.clear === 'function') {
        queryClient.clear();
      }
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