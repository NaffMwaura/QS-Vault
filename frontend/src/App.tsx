/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import  { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { QueryClientProvider } from "@tanstack/react-query";

// Features & Libs
import { AuthProvider, useAuth } from "./features/auth/AuthContext";
import { queryClient } from "./lib/queryClient";
import { useSync } from "./hooks/useSync";

// Modular Imports (Sandbox & Production Handshake)
let MarketingPage: any = () => null;
let LoginPage: any = () => null;
let DashboardPage: any = () => null;
let ProjectTakeoffPage: any = () => null;
let AdminDashboardPage: any = () => null;
let AppShell: any = ({ children }: any) => <>{children}</>;

const resolveModules = async () => {
  try {
    MarketingPage = (await import("./components/pages/MarketingPage")).default;
    LoginPage = (await import("./components/pages/LoginPage")).default;
    DashboardPage = (await import("./components/pages/DashboardPage")).default;
    ProjectTakeoffPage = (await import("./features/takeoff/ProjectTakeoffPage")).default;
    AdminDashboardPage = (await import("./components/pages/AdminDashboardPage")).default;
    AppShell = (await import("./components/layout/AppShell")).default;
  } catch (e) {
    console.warn("App Router: Operating in shim mode.");
  }
};

resolveModules();

/** --- WRAPPER COMPONENT: TAKEOFF_WORKSPACE --- **/
const ProjectTakeoffWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  if (!id) return <Navigate to="/dashboard" replace />;

  return (
    <ProjectTakeoffPage 
      projectId={id} 
      projectName="Technical Workspace" 
      onBack={() => navigate('/dashboard', { replace: true })} 
    />
  );
};

/** --- MASTER NAVIGATION ENGINE --- **/
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

  // Professional Loading State
  if (isLoading || (session && role === null)) {
    return (
      <div className={`h-screen w-screen flex flex-col items-center justify-center gap-8 transition-colors duration-700 
        ${theme === 'dark' ? 'bg-[#09090b]' : 'bg-zinc-100'}`}>
        <div className="relative">
          <Loader2 className={`w-16 h-16 animate-spin ${theme === 'dark' ? 'text-amber-500' : 'text-amber-600'}`} />
          <div className="absolute inset-0 blur-3xl bg-amber-500/10 animate-pulse" />
        </div>
        <div className="space-y-4 text-center">
          <h2 className={`font-black uppercase tracking-[0.6em] text-sm italic ${theme === 'dark' ? 'text-amber-500' : 'text-zinc-900'}`}>
            QS VAULT INITIALIZING
          </h2>
          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
            {isOnline ? "Verifying Infrastructure Sync..." : "Opening Local Node Storage..."}
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
        {/* 1. OFFICE DASHBOARD (Managed within Sidebar Frame) */}
        <Route path="/dashboard" element={<AppShell><DashboardPage /></AppShell>} />
        <Route path="/admin-dashboard" element={<AppShell><AdminDashboardPage /></AppShell>} />
        
        {/* 2. TECHNICAL ENGINE (Fullscreen - No Sidebar) */}
        <Route path="/projects/:id" element={<ProjectTakeoffWrapper />} />
        
        {/* 3. REDIRECTS */}
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

/** --- APP ENTRY POINT --- **/
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