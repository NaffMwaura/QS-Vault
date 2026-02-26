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
import ProjectDetailPage from "./components/pages/ProjectsDetailPage";

// Layout
import AppShell from "./components/layout/AppShell";

/**
 * RootComponent manages the top-level routing logic.
 * It uses the Auth state to decide whether to show the "Project Vault" (AppShell)
 * or the "Public Marketing" view.
 */
const RootComponent = () => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();

  // Initialize the background "Heartbeat" to sync measurements to the cloud
  // This hook monitors connectivity and processes the Dexie sync queue.
  useSync();

  // Initial Auth Check / Synchronizing Splash Screen
  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#09090b] flex flex-col items-center justify-center gap-6 transition-colors duration-500">
        <div className="relative">
          {/* This Loader2 with animate-spin handles the rotation you asked about */}
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
          <div className="absolute inset-0 blur-xl bg-amber-500/20 animate-pulse" />
        </div>
        <div className="space-y-2 text-center">
          <h2 className="text-amber-500 font-black uppercase tracking-[0.5em] text-xs italic">
            QS POCKET KNIFE
          </h2>
          <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest animate-pulse">
            Establishing Secure Link...
          </p>
        </div>
      </div>
    );
  }

  // --- PROTECTED AREA: Project Vault Access ---
  if (session) {
    return (
      /* Removed session prop call to match latest AppShell.tsx clean interface */
      <AppShell>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          
          {/* Automatic Redirection Logic for Authenticated Users */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppShell>
    );
  }

  // --- PUBLIC AREA: Marketing & Authorization ---
  return (
    <Routes>
      <Route 
        path="/" 
        element={<MarketingPage onGetStarted={() => navigate("/login")} />} 
      />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Catch-all: Redirect unknown public routes back to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

/**
 * Main Application Wrapper
 * Order of providers is critical for state propagation.
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