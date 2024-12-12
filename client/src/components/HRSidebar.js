import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./HRSidebar.css";

const HRSidebar = () => {
  const [notifications, setNotifications] = useState(0);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("hrToken");
    navigate("/");
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("hrToken");
        const res = await axios.get("http://localhost:5000/api/hr/notifications", {
          headers: { Authorization: token },
        });
        setNotifications(res.data.newApplications || 0);
      } catch (error) {
        console.error("Error fetching notifications:", error.response?.data?.message || error.message);
      }
    };

    fetchNotifications();

    // Optionally, you can set an interval to fetch notifications periodically
    const interval = setInterval(fetchNotifications, 60000); // Refresh every 1 minute
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

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
            <Link to="/hr/leave-management">Manage Leaves {notifications > 0 && <span className="notification-count">{notifications}</span>}</Link>
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
