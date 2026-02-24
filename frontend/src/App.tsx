import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { QueryClientProvider } from "@tanstack/react-query";

// Local Imports based on our new structure
import { AuthProvider, useAuth } from "./features/auth/AuthContext";
import { queryClient } from "./lib/queryClient";
import { useSync } from "./hooks/useSync";

// Pages
import MarketingPage from "./pages/MarketingPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";

// Layout
import AppShell from "./components/layout/AppShell";

/**
 * RootComponent handles the conditional rendering between 
 * Authenticated (AppShell) and Public (Marketing/Login) views.
 */
const RootComponent = () => {
  const { session, isLoading } = useAuth();

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
      <Route path="/" element={<MarketingPage />} />
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