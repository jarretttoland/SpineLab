// FILE: src/App.jsx
// Replace your existing src/App.jsx with this entire file.
//
// Two changes from your current version:
//   1. Added /sources route inside the Layout block (you'd added the
//      import already but forgot the route — that's why it wasn't showing up)
//   2. Removed /pricing route and the Pricing import (Apple flagged this
//      as confusing for a 100% free app)
//
// Everything else preserved.

import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";

import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import Landing from "./pages/Landing";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import Routine from "./pages/Routine";
import PostureScan from "./pages/PostureScan";
import Progress from "./pages/Progress";
import Account from "./pages/Account";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Sources from "./pages/Sources";

const LoadingScreen = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
    <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin" />
  </div>
);

const ProtectedAppRoutes = () => {
  const { isLoadingAuth, isAuthenticated } = useAuth();

  if (isLoadingAuth) return <LoadingScreen />;

  if (!isAuthenticated) return <Landing />;

  return (
    <Routes>
      {/* No bottom nav */}
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/onboarding-scan" element={<PostureScan />} />

      {/* Bottom nav only after onboarding/dashboard app */}
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/routine" element={<Routine />} />
        <Route path="/scan" element={<PostureScan />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/account" element={<Account />} />
        <Route path="/sources" element={<Sources />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/*" element={<ProtectedAppRoutes />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <div className="app-shell">
            <AppRoutes />
            <Analytics />
          </div>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}
