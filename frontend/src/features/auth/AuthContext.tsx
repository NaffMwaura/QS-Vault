import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient, type Session, type User, type AuthChangeEvent } from "@supabase/supabase-js";
import { queryClient } from "../../lib/queryClient";

// --- 1. CONFIGURATION & UTILS ---

/**
 * Vite requires using import.meta.env to access environment variables.
 * process.env is a Node.js convention and will cause errors in the browser.
 */
const getSupabaseConfig = () => {
  return {
    url: import.meta.env.VITE_SUPABASE_URL || "",
    key: import.meta.env.VITE_SUPABASE_ANON_KEY || ""
  };
};

const config = getSupabaseConfig();

// Professional Guard: Log a clear error if the .env file is missing or misconfigured
if (!config.url || !config.key) {
  console.error(
    "CRITICAL: Supabase credentials not found. Ensure your .env file is in the root directory " +
    "and variables start with 'VITE_'. Restart your dev server after changes."
  );
}

// Initialize Supabase client with fallback strings to prevent immediate crash
const supabase = createClient(
  config.url || "https://placeholder-id.supabase.co",
  config.key || "placeholder-key"
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
    // Check for saved preference, otherwise default to dark mode for the professional QS look
    const saved = localStorage.getItem("qs_theme") as Theme;
    return saved || "dark";
  });

  // Sync theme with the HTML document class for Tailwind CSS
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
        // Check active sessions on mount
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        // Professional delay to show branding and allow sync to warm up
        setTimeout(() => setIsLoading(false), 800);
      }
    };

    initializeAuth();

    // Listen for auth changes (sign in, sign out, token refresh)
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
      // Clear TanStack Query cache to ensure data security between user sessions
      queryClient.clear();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // --- PROVIDER VALUE ---
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

// --- 6. HOOK ---

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};