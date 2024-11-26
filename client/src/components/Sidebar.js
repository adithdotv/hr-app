import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("employeeToken");
    navigate("/employee/login");
  };

  return (
    <aside className="sidebar">
      <h2>Employee Dashboard</h2>
      <ul>
        <li>
          <Link to="/employee/dashboard">Profile</Link>
        </li>
        <li>
          <Link to="/employee/apply-leave">Apply For Leave</Link>
        </li>
        <li>
          <Link to="/employee/change-password">Change Password</Link>
        </li>
        <li onClick={handleLogout} className="logout">
          Logout
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
