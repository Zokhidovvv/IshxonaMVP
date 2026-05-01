import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./store/AuthContext";
import { ToastProvider } from "./components/Toast";
import LoginPage from "./pages/LoginPage";
import TVDashboard from "./pages/TVDashboard";
import BossPanel from "./pages/BossPanel";
import AdminPanel from "./pages/AdminPanel";
import SalesPage from "./pages/SalesPage";

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/tv" element={<TVDashboard />} />
            <Route path="/admin" element={
              <ProtectedRoute roles={["admin"]}>
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/boss" element={
              <ProtectedRoute roles={["boss"]}>
                <BossPanel />
              </ProtectedRoute>
            } />
            <Route path="/sales" element={
              <ProtectedRoute roles={["sales"]}>
                <SalesPage />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
