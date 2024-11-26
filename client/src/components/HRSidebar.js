import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./HRSidebar.css";

const HRSidebar = () => {

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("hrToken");
    navigate("/");
  };

  return (
    <div className="hr-sidebar">
      <div className="sidebar-header">
        <h2>HR Dashboard</h2>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li>
            <Link to="/hr/dashboard">Home</Link>
          </li>
          <li>
            <Link to="/hr/add-employee">Add Employee</Link>
          </li>
          <li>
            <Link to="/hr/leave-management">Manage Leaves</Link>
          </li>
          <li onClick={handleLogout}>
            <Link>Logout</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default HRSidebar;
