import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { QueryClientProvider } from "@tanstack/react-query";

// Local Imports based on our new structure
import { AuthProvider, useAuth } from "./features/auth/AuthContext";
import { queryClient } from "./lib/queryClient";
import { useSync } from "./hooks/useSync";

// Pages
import MarketingPage from "./components/pages/MarketingPage";
import LoginPage from "./components/pages/LoginPage";
import DashboardPage from "./components/pages/DashboardPage";
import ProjectDetailPage from "./components/pages/ProjectsDetailPage";

// Layout
import AppShell from "./components/layout/AppShell";

/**
 * RootComponent handles the conditional rendering between 
 * Authenticated (AppShell) and Public (Marketing/Login) views.
 */
const RootComponent = () => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();

  // Initialize the background sync engine (Dexie <-> Supabase)
  useSync();

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#09090b] flex flex-col items-center justify-center gap-4 transition-colors">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 animate-pulse">
          Initializing Vault...
        </div>
      </div>
    );
  }

  if (session) {
    return (
      /* Fix 1: AppShell session prop error is likely in its interface. 
         Ensure AppShellProps in AppShell.tsx includes 'session: Session | null' */
      <AppShell session={session}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppShell>
    );
  }

  return (
    <Routes>
      {/* Fix 2: Added the required onGetStarted prop */}
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
 * Main Entry Point
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