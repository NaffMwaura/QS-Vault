import React, { lazy, Suspense, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { QueryClientProvider } from "@tanstack/react-query";

// Features & Libs
import { AuthProvider, useAuth } from "./features/auth/AuthContext";
import { queryClient } from "./lib/queryClient";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { useSync } from "./hooks/useSync";
import { db } from "./lib/database/database";

// Layout
import AppShell from "./components/layout/AppShell";

function ThemeBridge() {
  const { theme } = useAuth();
  
  React.useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    document.documentElement.dataset.theme = theme;
    
    // Update theme-color meta tag
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", theme === "dark" ? "#283618" : "#E0E1DD");
    }
  }, [theme]);
  
  return null;
}

const MarketingPage = lazy(() => import("./components/pages/MarketingPage"));
const LoginPage = lazy(() => import("./components/pages/LoginPage"));
const DashboardPage = lazy(() => import("./components/pages/DashboardPage"));
const ProjectTakeoffPage = lazy(() => import("./features/takeoff/ProjectTakeoffPage"));
const AdminDashboardPage = lazy(() => import("./components/pages/AdminDashboardPage"));

const RouteFallback = () => (
  <div className="theme-page flex min-h-[50vh] items-center justify-center">
    <div className="flex flex-col items-center gap-4 text-center">
      <Loader2 className="theme-accent h-10 w-10 animate-spin" />
      <p className="theme-public-label">Loading workspace</p>
    </div>
  </div>
);

const ProjectRoute = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("Technical Workspace");

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    const loadProjectName = async () => {
      try {
        const project = await db.projects.get(id);
        if (isMounted && project?.name) {
          setProjectName(project.name);
        }
      } catch (err) {
        console.error("ProjectRoute: failed to load project name", err);
      }
    };

    loadProjectName();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (!id) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <ProjectTakeoffPage
      projectId={id}
      projectName={projectName}
      onBack={() => navigate('/dashboard')}
    />
  );
};

/**
 * RootComponent manages the top-level routing logic.
 * It separates "Office Management" (with sidebar) from "Technical Takeoff" (fullscreen).
 */
const RootComponent = () => {
  const { session, isLoading, role } = useAuth();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

  useSync();

  // LOADING / SPLASH SCREEN
  if (isLoading || (session && role === null)) {
    return (
      <div className="theme-page h-screen w-screen flex flex-col items-center justify-center gap-8 transition-colors duration-700">
        <div className="relative">
          <Loader2 className="theme-accent w-16 h-16 animate-spin" />
          <div className="theme-accent-surface absolute inset-0 blur-2xl animate-pulse rounded-full" />
        </div>
        <div className="space-y-4 text-center">
          <h2 className="theme-heading font-black uppercase tracking-[0.6em] text-sm italic">
            INITIALIZING OFFICE...
          </h2>
          <p className="theme-meta text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
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
          <Route path="/projects/:id" element={<ProjectRoute />} />
          
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
        <ThemeBridge />
        <Router>
          <RootComponent />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
