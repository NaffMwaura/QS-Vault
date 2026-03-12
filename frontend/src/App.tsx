import  { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { QueryClientProvider } from "@tanstack/react-query";

// Features & Libs
import { AuthProvider, useAuth } from "./features/auth/AuthContext";
import { queryClient } from "./lib/queryClient";
import { useSync } from "./hooks/useSync";

// Components & Pages
import MarketingPage from "./components/pages/MarketingPage";
import LoginPage from "./components/pages/LoginPage";
import DashboardPage from "./components/pages/DashboardPage";
import ProjectTakeoffPage from "./features/takeoff/ProjectTakeoffPage"; 
import AdminDashboardPage from "./components/pages/AdminDashboardPage"; 

// Layout
import AppShell from "./components/layout/AppShell";

/**
 * RootComponent manages the top-level routing logic.
 * It separates "Office Management" (with sidebar) from "Technical Takeoff" (fullscreen).
 */
const RootComponent = () => {
  const { session, isLoading, theme, role } = useAuth();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useSync();

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

  // LOADING / SPLASH SCREEN
  if (isLoading || (session && role === null)) {
    return (
      <div className={`h-screen w-screen flex flex-col items-center justify-center gap-8 transition-colors duration-700 
        ${theme === 'dark' ? 'bg-[#09090b]' : 'bg-zinc-100'}`}>
        <div className="relative">
          <Loader2 className={`w-16 h-16 animate-spin ${theme === 'dark' ? 'text-amber-500' : 'text-amber-600'}`} />
          <div className="absolute inset-0 blur-2xl bg-amber-500/20 animate-pulse" />
        </div>
        <div className="space-y-4 text-center">
          <h2 className={`font-black uppercase tracking-[0.6em] text-sm italic ${theme === 'dark' ? 'text-amber-500' : 'text-zinc-900'}`}>
            INITIALIZING OFFICE...
          </h2>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
            {isOnline ? "Syncing Cloud Data..." : "Opening Offline Project Files..."}
          </p>
        </div>
      </div>
    );
  }

  const isAdmin = role === 'admin' || role === 'super-admin';
  const defaultProtectedRoute = isAdmin ? "/admin-dashboard" : "/dashboard";

  if (session) {
    return (
      <Routes>
        {/* 1. OFFICE MANAGEMENT (Contains the Global Sidebar) */}
        <Route path="/dashboard" element={<AppShell><DashboardPage /></AppShell>} />
        <Route path="/admin-dashboard" element={<AppShell><AdminDashboardPage /></AppShell>} />
        
        {/* 2. TECHNICAL WORKSPACE (NO SIDEBAR - FULLSCREEN) */}
        <Route path="/projects/:id" element={
          <ProjectTakeoffPage 
            projectId="current-active-project" 
            projectName="Technical Workspace" 
            onBack={() => {
              // Forced navigation handshake to ensure we exit the technical engine cleanly
              navigate('/dashboard');
            }} 
          />
        } />
        
        <Route path="/" element={<Navigate to={defaultProtectedRoute} replace />} />
        <Route path="/login" element={<Navigate to={defaultProtectedRoute} replace />} />
        <Route path="*" element={<Navigate to={defaultProtectedRoute} replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<MarketingPage onGetStarted={() => navigate("/login")} />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

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