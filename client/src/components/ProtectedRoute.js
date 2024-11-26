import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, role }) => {
  const token =
    role === "hr" ? localStorage.getItem("hrToken") : localStorage.getItem("employeeToken");

  return token ? children : <Navigate to={`/${role}/login`} />;
};

export default ProtectedRoute;
