import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet, // Import Outlet for nested routes
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
// import Login from "./pages/Login";
// Assuming Dashboard is the same as Home, or you intend to use Home for the dashboard content.
// If Dashboard is a separate component, adjust accordingly.
// import Dashboard from "./pages/Home";
import ViewUsers from "./pages/ViewUsers";
import EnrollUser from "./pages/EnrollUser";
import ViewLogs from "./pages/ViewLogs";
import AddAdmin from "./pages/AddAdmin";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import MainLayout from "./layouts/MainLayout"; // This component should contain your Sidebar and an <Outlet />
import Home from "./pages/Home"; // This is likely your main dashboard content
import Dashboard from "./pages/Dashboard";
import AuthLayout from "./layouts/AuthLayout"; // This component should wrap your Login page
import Recognize from "./pages/Recognize";
import ViewAttendance from "./pages/ViewAttendancePage"; // Assuming this is the correct path for your attendance page
import Login from "./pages/Login";

/**
 * ProtectedRoute component to guard routes.
 * It checks if the user is authenticated; if not, it redirects to the login page.
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        Loading...
      </div>
    );
  }
  if (!user) {
    // Redirect to login if not authenticated.
    // `replace` prop prevents adding the current location to the history stack.
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes: Wrapped by AuthLayout */}
          {/* When the path is '/', AuthLayout will render, and its <Outlet> will render Login */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            {/* Add other public routes here if you have any (e.g., /register, /forgot-password) */}
          </Route>

          {/* Protected Routes: Wrapped by MainLayout and ProtectedRoute */}
          {/* When any of these paths match, ProtectedRoute will check auth,
              then MainLayout will render, and its <Outlet> will render the specific child component. */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout /> 
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="users" element={<ViewUsers />} />
            <Route path="enroll" element={<EnrollUser />} />
            <Route path="logs" element={<ViewLogs />} />
            <Route path="add-admin" element={<AddAdmin />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            {/* <Route path="home" element={<Home />} /> */}
          </Route>

          {/* Optional: Catch-all route for any unmatched paths */}
          {/* Redirects to home if authenticated, otherwise to login */}
          <Route
            path="*"
            element={
                <Navigate to="/home" replace />
            }
          />
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/recognize" element={<Recognize />} />
            <Route path="/attendance" element={<ViewAttendance />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
