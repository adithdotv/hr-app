import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HRLogin from "./pages/HRLogin";
import HRDashboard from "./pages/HRDashboard";
import EmployeeLogin from "./pages/EmployeeLogin"; // For employees to log in
import EmployeeDashboard from "./pages/EmployeeDashboard"; // For employees to view their dashboard
import AddEmployee from './pages/AddEmployee';
import Home from "./pages/Home"; 
import ProtectedRoute from "./components/ProtectedRoute";
import LeaveApplication from "./pages/LeaveApplication";
import ViewEmployeeProfile from "./pages/ViewEmployeeProfile";
import LeaveManagement from "./pages/LeaveManagement";
import ChangePassword from "./pages/ChangePassword";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Home Page */}
          <Route path="/" element={<Home />} />

          <Route
            path="/hr/dashboard"
            element={
              <ProtectedRoute role="hr">
                <HRDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/add-employee"
            element={
              <ProtectedRoute role="hr">
                <AddEmployee />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/employee/:id"
            element={
              <ProtectedRoute role="hr">
                <ViewEmployeeProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/leave-management"
            element={
              <ProtectedRoute role="hr">
                <LeaveManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/dashboard"
            element={
              <ProtectedRoute role="employee">
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/change-password"
            element={
              <ProtectedRoute role="employee">
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/apply-leave"
            element={
              <ProtectedRoute role="employee">
                <LeaveApplication />
              </ProtectedRoute>
            }
          />
          <Route path="/hr/login" element={<HRLogin />} />
          <Route path="/employee/login" element={<EmployeeLogin />} />

          {/* Fallback Route for Undefined Paths */}
          <Route path="*" element={<h1>404 - Page Not Found</h1>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
