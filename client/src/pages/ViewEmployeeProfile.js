import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ViewEmployeeProfile.css";

const ViewEmployeeProfile = () => {
  const { id } = useParams(); // Get employee ID from URL
  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const token = localStorage.getItem("hrToken");
        const res = await axios.get(`http://localhost:5000/api/hr/employee/${id}`, {
          headers: { Authorization: token },
        });
        setEmployee(res.data);
        console.log(employee)
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Error fetching employee data");
      }
    };
    fetchEmployee();
  }, [id, employee]);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!employee) {
    return <div className="loading-message">Loading...</div>;
  }

  return (
    <div className="employee-profile">
      <h1>{employee.name}'s Profile</h1>
      <div className="profile-card">
        <div className="profile-header">
          <h2>Basic Information</h2>
        </div>
        <div className="profile-body">
          <p><strong>Email:</strong> {employee.email}</p>
          <p><strong>Phone:</strong> {employee.phone}</p>
          <p><strong>Position:</strong> {employee.position}</p>
          <p><strong>Department:</strong> {employee.department}</p>
          <p><strong>Salary:</strong> ${employee.salary}</p>
          <p><strong>Date of Joining:</strong> {new Date(employee.joiningDate).toLocaleDateString()}</p>
          <p>
            <strong>Resume:</strong>{' '}
            {employee.resume ? (
              <a
                href={`http://localhost:5000/uploads/${employee.resume}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Resume
              </a>
            ) : (
              'No resume uploaded'
            )}
          </p>
        </div>
      </div>
      <button className="back-button" onClick={() => navigate("/hr/dashboard")}>
        Back to Dashboard
      </button>
    </div>
  );
};

export default ViewEmployeeProfile;
