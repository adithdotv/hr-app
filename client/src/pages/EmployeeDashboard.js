import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import "./EmployeeDashboard.css";

const EmployeeDashboard = () => {
  const [employeeDetails, setEmployeeDetails] = useState({});
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("employeeToken");
    if (!token) {
      navigate("/employee/login");
      return;
    }
  }, [navigate]);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      const token = localStorage.getItem("employeeToken");
      try {
        const response = await axios.get("http://localhost:5000/api/auth/employee", {
          headers: { Authorization: token },
        });
        setEmployeeDetails(response.data);
      } catch (err) {
        setError("Failed to fetch data: " + (err.response?.data?.error || "Server error"));
      }
    };

    fetchEmployeeData();
  }, []);

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <header className="dashboard-header">
          <h1>Welcome, {employeeDetails.name || "Employee"}!</h1>
        </header>
        <section className="employee-info">
          <h2>Your Information</h2>
          <div className="info-grid">
            <div>
              <strong>Name:</strong> {employeeDetails.name}
            </div>
            <div>
              <strong>Email:</strong> {employeeDetails.email}
            </div>
            <div>
              <strong>Phone:</strong> {employeeDetails.phone}
            </div>
            <div>
              <strong>Position:</strong> {employeeDetails.position}
            </div>
            <div>
              <strong>Department:</strong> {employeeDetails.department}
            </div>
            <div>
              <strong>Joining Date:</strong>{" "}
              {new Date(employeeDetails.joiningDate).toLocaleDateString()}
            </div>
            <div>
              <strong>Salary:</strong> ${employeeDetails.salary}
            </div>
            <div>
            <strong>Resume:</strong>{' '}
            {employeeDetails.resume ? (
              <a
                href={`http://localhost:5000/uploads/${employeeDetails.resume}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Resume
              </a>
            ) : (
              'No resume uploaded'
            )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
