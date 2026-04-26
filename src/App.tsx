import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./components/ThemeProvider";
import { LanguageProvider } from "./context/LanguageContext";
import { useEffect, useState, Suspense, Component, ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import InvestorDashboard from "./pages/InvestorDashboard";
import StartupDashboard from "./pages/StartupDashboard";
import Signup from "./pages/Signup";
import StartupSignup from "./pages/StartupSignup";
import InvestorSignup from "./pages/InvestorSignup";
import VerifyEmail from "./pages/VerifyEmail";
import InviteSignup from "./pages/InviteSignup";
import InviteVerify from "./pages/InviteVerify";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import StartupScoring from "./pages/StartupScoring";
import Articles from "./pages/Articles";
import ArticleDetail from "./pages/ArticleDetail";
import PendingVerification from "./pages/PendingVerification";
import AdminInvite from "./pages/AdminInvite";
import TermsAndConditions from "./pages/TermsAndConditions";
import StartupProfile from "./pages/StartupProfile";
import InvestorProfile from "./pages/InvestorProfile";
import StatusGuard from "./components/auth/StatusGuard";
import MatchmakingInvestors from "./pages/MatchmakingInvestors";
import MatchmakingInvestorDetails from "./pages/MatchmakingInvestorDetails";
import MatchmakingStartupSelection from "./pages/MatchmakingStartupSelection";
import "./App.css";
import InterestedInvestors from "./pages/InterestedInvestors";
import InvestorBrowseStartups from "./components/InvestorBrowseStartups";
import InterestedStartups from "./pages/InterestedStartups";
import InvestorPortfolio from "./pages/InvestorPortfolio";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ErrorFallback = ({ error }: { error: Error }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Something went wrong
        </h2>
        <p className="text-gray-700 mb-4">
          The application encountered an unexpected error:
        </p>
        <div className="bg-gray-100 p-4 rounded-lg overflow-auto mb-4">
          <pre className="text-sm text-red-800 whitespace-pre-wrap">
            {error.message}
          </pre>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Refresh the page
        </button>
      </div>
    </div>
  );
};

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error || new Error("Unknown error occurred")}
        />
      );
    }

    return this.props.children;
  }
}

const ProtectedRoute = ({
  children,
  requiredAccountType,
}: {
  children: React.ReactNode;
  requiredAccountType?: string | string[];
}) => {
  const { user, profile, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        console.log("User not authenticated, redirecting to login");
      } else if (requiredAccountType) {
        const accountType = profile?.accountType || user?.accountType;
        const requiredTypes = Array.isArray(requiredAccountType)
          ? requiredAccountType
          : [requiredAccountType];

        if (!accountType || !requiredTypes.includes(accountType)) {
          console.log(`User does not have required account type`);
        }
      }
    }
  }, [user, profile, isLoading, requiredAccountType]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredAccountType) {
    const accountType = profile?.accountType || user?.accountType;
    const requiredTypes = Array.isArray(requiredAccountType)
      ? requiredAccountType
      : [requiredAccountType];

    if (!accountType || !requiredTypes.includes(accountType)) {
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  // Handles Supabase recovery links that may land on any route
  const AuthLinkHandler = () => {
    const navigate = useNavigate();
    useEffect(() => {
      try {
        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : "";
        const params = new URLSearchParams(hash);
        const type = params.get("type");
        const access = params.get("access_token");
        const refresh = params.get("refresh_token");
        if (type === "recovery" && access && refresh) {
          if (window.location.pathname !== "/reset-password") {
            // Preserve tokens in hash during redirect
            window.location.replace(`/reset-password${window.location.hash}`);
          }
        }
      } catch (_) {
        // ignore
      }
    }, [navigate]);
    return null;
  };
  return (
    <BrowserRouter>
      <AuthLinkHandler />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signup/startup" element={<StartupSignup />} />
        <Route path="/signup/investor" element={<InvestorSignup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/invite-signup" element={<InviteSignup />} />
        <Route path="/invite-verify" element={<InviteVerify />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/pending-verification" element={<PendingVerification />} />
        <Route
          path="/startup-profile"
          element={
            <ProtectedRoute requiredAccountType="startup">
              <StatusGuard>
                <ErrorBoundary>
                  <StartupProfile />
                </ErrorBoundary>
              </StatusGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/investor-profile"
          element={
            <ProtectedRoute requiredAccountType="investor">
              <StatusGuard>
                <ErrorBoundary>
                  <InvestorProfile />
                </ErrorBoundary>
              </StatusGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/investor-dashboard"
          element={
            <ProtectedRoute requiredAccountType="investor">
              <StatusGuard>
                <ErrorBoundary>
                  <InvestorDashboard />
                </ErrorBoundary>
              </StatusGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/portfolio"
          element={
            <ProtectedRoute requiredAccountType="investor">
              <StatusGuard>
                <ErrorBoundary>
                  <InvestorPortfolio />
                </ErrorBoundary>
              </StatusGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/startup-dashboard"
          element={
            <ProtectedRoute requiredAccountType="startup">
              <StatusGuard>
                <ErrorBoundary>
                  <StartupDashboard />
                </ErrorBoundary>
              </StatusGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/interested-investors"
          element={
            <ProtectedRoute requiredAccountType="startup">
              <StatusGuard>
                <ErrorBoundary>
                  <InterestedInvestors />
                </ErrorBoundary>
              </StatusGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/startups"
          element={
            <ProtectedRoute requiredAccountType="investor">
              <StatusGuard>
                <ErrorBoundary>
                  <InvestorBrowseStartups />
                </ErrorBoundary>
              </StatusGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/startups/interested"
          element={
            <ProtectedRoute requiredAccountType="investor">
              <StatusGuard>
                <ErrorBoundary>
                  <InterestedStartups />
                </ErrorBoundary>
              </StatusGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredAccountType="admin">
              <ErrorBoundary>
                <Admin />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requiredAccountType="admin">
              <ErrorBoundary>
                <Admin />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/blog"
          element={
            <ProtectedRoute requiredAccountType="admin">
              <ErrorBoundary>
                <Admin />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/startups"
          element={
            <ProtectedRoute requiredAccountType="admin">
              <ErrorBoundary>
                <Admin />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/investors"
          element={
            <ProtectedRoute requiredAccountType="admin">
              <ErrorBoundary>
                <Admin />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/startup-scoring"
          element={
            <ProtectedRoute requiredAccountType="admin">
              <ErrorBoundary>
                <StartupScoring />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/matchmaking"
          element={
            <ProtectedRoute requiredAccountType="admin">
              <ErrorBoundary>
                <MatchmakingInvestors />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/matchmaking/investor/:investorId"
          element={
            <ProtectedRoute requiredAccountType="admin">
              <ErrorBoundary>
                <MatchmakingInvestorDetails />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/matchmaking/investor/:investorId/select-startups"
          element={
            <ProtectedRoute requiredAccountType="admin">
              <ErrorBoundary>
                <MatchmakingStartupSelection />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/articles"
          element={
            <ErrorBoundary>
              <Articles />
            </ErrorBoundary>
          }
        />
        <Route
          path="/articles/:slug"
          element={
            <ErrorBoundary>
              <ArticleDetail />
            </ErrorBoundary>
          }
        />
        <Route
          path="/admin/invite"
          element={
            <ErrorBoundary>
              <AdminInvite />
            </ErrorBoundary>
          }
        />
        <Route
          path="/terms-and-conditions"
          element={
            <ErrorBoundary>
              <TermsAndConditions />
            </ErrorBoundary>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => {
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS Safari
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // Add iOS-specific body class for CSS targeting
    if (isIOSDevice) {
      document.body.classList.add("ios-device");
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <Analytics />
            <LanguageProvider>
              <Suspense
                fallback={
                  <div className="flex h-screen items-center justify-center">
                    <div className="text-center">
                      <div
                        className={`rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4 ${
                          isIOS ? "animate-pulse" : "animate-spin"
                        }`}
                      ></div>
                      <p className="text-muted-foreground">
                        Loading application...
                      </p>
                    </div>
                  </div>
                }
              >
                <AppRoutes />
              </Suspense>
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
