import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import UserAvailability from "./pages/UserAvailability";
import MentorAvailability from "./pages/MentorAvailability";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSchedules from "./pages/AdminSchedules";
import AdminSettings from "./pages/AdminSettings";
import AdminCallRequests from "./pages/AdminCallRequests";
import AdminBookings from "./pages/AdminBookings";
import AdminMentors from "./pages/AdminMentors";
import CallRequests from "./pages/CallRequests";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <div className="text-ink-500 text-sm">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function DefaultRedirect() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <div className="text-ink-500 text-sm">Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "MENTOR") return <Navigate to="/mentor" replace />;
  if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
  return <Navigate to="/availability" replace />;
}

function NormalizePathname({ children }) {
  const location = useLocation();
  const pathname = location.pathname;
  if (pathname.startsWith("//")) {
    const fixed = pathname.replace(/\/+/g, "/") + location.search;
    return <Navigate to={fixed} replace />;
  }
  return children;
}

export default function App() {
  return (
    <NormalizePathname>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        {/* Legacy SSO/Welcome redirects → login */}
        <Route path="/welcome" element={<Navigate to="/login" replace />} />
        <Route path="/sso" element={<Navigate to="/login" replace />} />
        <Route path="/sso/sso" element={<Navigate to="/login" replace />} />

        {/* Protected app shell */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DefaultRedirect />} />

          {/* User routes */}
          <Route
            path="availability"
            element={
              <ProtectedRoute allowedRoles={["USER", "ADMIN"]}>
                <UserAvailability />
              </ProtectedRoute>
            }
          />
          <Route
            path="requests"
            element={
              <ProtectedRoute allowedRoles={["USER"]}>
                <CallRequests />
              </ProtectedRoute>
            }
          />

          {/* Mentor routes */}
          <Route
            path="mentor"
            element={
              <ProtectedRoute allowedRoles={["MENTOR"]}>
                <MentorAvailability />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="admin"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/schedules"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminSchedules />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/settings"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/requests"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminCallRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/mentors"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminMentors />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/bookings"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminBookings />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </NormalizePathname>
  );
}
