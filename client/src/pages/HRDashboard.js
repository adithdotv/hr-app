import React, { useState, useEffect } from "react";
import axios from "axios";
import HRSidebar from "../components/HRSidebar";
import "./HRDashboard.css";

const HrDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [message, setMessage] = useState("");


  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("hrToken");
        const res = await axios.get("http://localhost:5000/api/hr/employees", {
          headers: { Authorization: token },
        });
        setEmployees(res.data);
      } catch (err) {
        console.error(err);
        setMessage(
          err.response?.data?.message || "Error fetching employee data"
        );
      }
    };
    fetchEmployees();
  }, []);

  return (
    <div className="hr-dashboard-container">
      {/* Sidebar */}
      <HRSidebar />

      {/* Main Content */}
      <div className="main-content">
        <h1>Employee Management</h1>
        {message && <p className="error-message">{message}</p>}
        <table className="employee-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Salary</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee, index) => (
              <tr key={employee._id}>
                <td>{index + 1}</td>
                <td>
                  <a href={`/hr/employee/${employee._id}`} className="profile-link">
                    {employee.name}
                  </a>
                </td>
                <td>{employee.email}</td>
                <td>{employee.role}</td>
                <td>${employee.salary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HrDashboard;
