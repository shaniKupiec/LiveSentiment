import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import PresenterDashboard from "./pages/PresenterDashboard";
import AudienceView from "./pages/AudienceView";

// Simple role-based routing (expand with real auth later)
const App: React.FC = () => {
  // Placeholder: Replace with real auth/role logic
  const userRole = localStorage.getItem("role"); // "presenter" or "audience"

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/presenter"
          element={userRole === "presenter" ? <PresenterDashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/audience"
          element={userRole === "audience" ? <AudienceView /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;
