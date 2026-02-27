import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Loader2, Wifi, WifiOff } from "lucide-react";
import { QueryClientProvider } from "@tanstack/react-query";

// Features & Libs
import { AuthProvider, useAuth } from "./features/auth/AuthContext";
import { queryClient } from "./lib/queryClient";
import { useSync } from "./hooks/useSync";

// Components & Pages
import MarketingPage from "./components/pages/MarketingPage";
import LoginPage from "./components/pages/LoginPage";
import DashboardPage from "./components/pages/DashboardPage";
import ProjectDetailPage from "./components/pages/ProjectsDetailPage";
import AdminDashboardPage from "./components/pages/AdminDashboardPage"; 

// Layout
import AppShell from "./components/layout/AppShell";

/**
 * RootComponent manages the top-level routing logic.
 * It is now theme-aware and connectivity-aware during the loading phase.
 */
const RootComponent = () => {
  const { session, isLoading, theme } = useAuth();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Initialize the background sync engine
  useSync();

  // Track connectivity for the splash screen
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

  // INITIAL LOADING / SPLASH SCREEN
  if (isLoading) {
    return (
      <div className={`h-screen w-screen flex flex-col items-center justify-center gap-8 transition-colors duration-700 
        ${theme === 'dark' ? 'bg-[#09090b]' : 'bg-zinc-100'}`}>
        
        <div className="relative">
          <Loader2 className={`w-16 h-16 animate-spin ${theme === 'dark' ? 'text-amber-500' : 'text-amber-600'}`} />
          <div className="absolute inset-0 blur-2xl bg-amber-500/20 animate-pulse" />
        </div>

        <div className="space-y-4 text-center">
          <h2 className={`font-black uppercase tracking-[0.6em] text-sm italic 
            ${theme === 'dark' ? 'text-amber-500' : 'text-zinc-900'}`}>
            QS POCKET KNIFE
          </h2>
          
          <div className="flex flex-col items-center gap-2">
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
              {isOnline ? "Establishing Secure Link..." : "Initializing Offline Vault..."}
            </p>
            
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest transition-all
              ${isOnline 
                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600' 
                : 'bg-red-500/5 border-red-500/20 text-red-500 animate-pulse'}`}>
              {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
              {isOnline ? 'Network Active' : 'Offline Mode'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- PROTECTED AREA (AUTHENTICATED) ---
  if (session) {
    return (
      <AppShell>
        <Routes>
          {/* Main Surveyor Workspace */}
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* Command Center: Restricted to authorized nodes */}
          <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
          
          {/* Project Deep-Dive */}
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          
          {/* Global Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppShell>
    );
  }

  // --- PUBLIC AREA (UNAUTHENTICATED) ---
  return (
    <Routes>
      <Route 
        path="/" 
        element={<MarketingPage onGetStarted={() => navigate("/login")} />} 
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

/**
 * Main Application Wrapper
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <RootComponent />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;