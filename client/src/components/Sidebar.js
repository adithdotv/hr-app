import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Sidebar.css";

const Sidebar = () => {
  const [notification, setNotification] = useState(null); // To store the most recent notification
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("employeeToken");
    navigate("/employee/login");
  };

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        const token = localStorage.getItem("employeeToken");
        const res = await axios.get("http://localhost:5000/api/employees/notifications", {
          headers: { Authorization: token },
        });
        setNotification(res.data.notification);
        console.log(res.data)
      } catch (error) {
        console.error("Error fetching notification:", error.response?.data?.message || error.message);
      }
    };

    fetchNotification();

    // Optionally, refresh the notification periodically
    const interval = setInterval(fetchNotification, 60000); // Refresh every 1 minute
    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

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
        <li className="notifications-section">
          <span>Notifications</span>
          {notification ? (
            <p className={`notification ${notification.status.toLowerCase()}`}>
              {notification.message}
            </p>
          ) : (
            <p>No new notifications</p>
          )}
        </li>
        <li onClick={handleLogout} className="logout">
          Logout
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
