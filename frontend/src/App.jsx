import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";

function ProtectedRoute({ role, children }) {
  const { user, token } = useAuth();

  if (!token || !user?.role) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) {
    return <Navigate to={user?.role === "admin" ? "/admin" : "/student"} replace />;
  }

  return children;
}

export default function App() {
  const { user, token } = useAuth();
  const homePath = user?.role === "admin" ? "/admin" : "/student";

  return (
    <Routes>
      <Route
        path="/login"
        element={
          token && user?.role ? (
            <Navigate to={homePath} replace />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student"
        element={
          <ProtectedRoute role="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={token && user?.role ? homePath : "/login"} replace />} />
    </Routes>
  );
}
