import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./HRLogin.css"; // Import the CSS file for styling

const HRLogin = () => {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate(); // React Router hook for navigation

  // Check if the HR is already logged in
  useEffect(() => {
    const token = localStorage.getItem("hrToken");
    if (token) {
      navigate("/hr/dashboard"); // Redirect to the dashboard if logged in
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/hr/login", credentials);
      localStorage.setItem("hrToken", response.data.token); // Save the token to localStorage
      setMessage("Login successful!");
      navigate("/hr/dashboard"); // Redirect to HR dashboard
    } catch (error) {
      setMessage("Login failed: " + (error.response?.data?.error || "Server error"));
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>HR Login</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              placeholder="Enter username"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              placeholder="Enter password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="login-btn">
            Login
          </button>
          <p className="message">{message}</p>
        </form>
      </div>
    </div>
  );
};

export default HRLogin;
