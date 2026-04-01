import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { QueryClientProvider } from "@tanstack/react-query";

// Features & Libs
import { AuthProvider, useAuth } from "./features/auth/AuthContext";
import { queryClient } from "./lib/queryClient";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { useSync } from "./hooks/useSync";

// Layout
import AppShell from "./components/layout/AppShell";

const MarketingPage = lazy(() => import("./components/pages/MarketingPage"));
const LoginPage = lazy(() => import("./components/pages/LoginPage"));
const DashboardPage = lazy(() => import("./components/pages/DashboardPage"));
const ProjectTakeoffPage = lazy(() => import("./features/takeoff/ProjectTakeoffPage"));
const AdminDashboardPage = lazy(() => import("./components/pages/AdminDashboardPage"));

const RouteFallback = () => (
  <div className="theme-page flex min-h-[50vh] items-center justify-center">
    <div className="flex flex-col items-center gap-4 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
      <p className="theme-public-label">Loading workspace</p>
    </div>
  </div>
);

/**
 * RootComponent manages the top-level routing logic.
 * It separates "Office Management" (with sidebar) from "Technical Takeoff" (fullscreen).
 */
const RootComponent = () => {
  const { session, isLoading, theme, role } = useAuth();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

  useSync();

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
      <Suspense fallback={<RouteFallback />}>
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
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<MarketingPage onGetStarted={() => navigate("/login")} />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
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
