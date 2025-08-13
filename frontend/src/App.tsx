import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import PresenterDashboard from "./pages/PresenterDashboard";
import AudienceView from "./pages/AudienceView";
import { CircularProgress, Box } from "@mui/material";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ErrorProvider } from "./components/ErrorHandler";
import ErrorBoundary from "./components/ErrorBoundary";

const AppRoutes: React.FC = () => {
  const { isAuthenticated, user, userRole, logout, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <CircularProgress size={60} sx={{ color: "white" }} />
      </Box>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={userRole === "presenter" ? "/presenter" : "/audience"} />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          path="/signup"
          element={
            isAuthenticated ? (
              <Navigate to={userRole === "presenter" ? "/presenter" : "/audience"} />
            ) : (
              <SignupPage />
            )
          }
        />

        {/* Protected routes */}
        <Route
          path="/presenter"
          element={
            isAuthenticated && userRole === "presenter" ? (
              <PresenterDashboard user={user} onLogout={logout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/audience"
          element={
            isAuthenticated && userRole === "audience" ? (
              <AudienceView user={user} onLogout={logout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Default redirect */}
        <Route
          path="*"
          element={
            isAuthenticated ? (
              <Navigate to={userRole === "presenter" ? "/presenter" : "/audience"} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ErrorProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ErrorProvider>
    </ErrorBoundary>
  );
};

export default App;
