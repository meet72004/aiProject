import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UploadPage from "./pages/UploadPage";
import ChoosePage from "./pages/ChoosePage";
import GeneratePage from "./pages/GeneratePage";
import McqPage from "./pages/McqPage";
import PracticePage from "./pages/PracticePage";
import DashboardPage from "./pages/DashboardPage";
import ApiKeyPage from "./pages/ApiKeyPage";
import "./App.css";

function ProtectedRoute({ children }) {
  const { isAuthenticated, ready } = useAuth();
  if (!ready) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children, redirectTo = "/" }) {
  const { isAuthenticated, ready } = useAuth();
  if (!ready) return null;
  if (isAuthenticated) return <Navigate to={redirectTo} replace />;
  return children;
}

function App() {
  const { ready } = useAuth();

  if (!ready) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner" />
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingOrApp />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/choose" element={<ProtectedRoute><ChoosePage /></ProtectedRoute>} />
        <Route path="/generate" element={<ProtectedRoute><GeneratePage /></ProtectedRoute>} />
        <Route path="/mcq" element={<ProtectedRoute><McqPage /></ProtectedRoute>} />
        <Route path="/practice" element={<ProtectedRoute><PracticePage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/settings/api-key" element={<ProtectedRoute><ApiKeyPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

function LandingOrApp() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <UploadPage /> : <LandingPage />;
}

export default App;
