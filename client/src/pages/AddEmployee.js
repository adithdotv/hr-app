import React, { useState } from "react";
import axios from "axios";
import HRSidebar from "../components/HRSidebar";
import './AddEmployee.css';

const AddEmployee = () => {
  const [employee, setEmployee] = useState({
    username: "",
    name: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    joiningDate: "",
    salary: "",
    resume: null,
  });

  const [message, setMessage] = useState("");

  // Handle input changes
  const handleChange = (e) => {
    setEmployee({ ...employee, [e.target.name]: e.target.value });
  };

  // Handle file input changes
  const handleFileChange = (e) => {
    setEmployee({ ...employee, resume: e.target.files[0] });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(employee).forEach((key) => {
      if (employee[key]) {
        formData.append(key, employee[key]);
      }
    });

    try {
      const token = localStorage.getItem("hrToken");
      const response = await axios.post("http://localhost:5000/api/hr/employees", formData, {
        headers: { Authorization: token },
        "Content-Type": "multipart/form-data",
      });

      setMessage(response.data.message || "Employee added successfully!");
      setEmployee({
        username: "",
        name: "",
        email: "",
        phone: "",
        position: "",
        department: "",
        joiningDate: "",
        salary: "",
        resume: null,
      });
    } catch (error) {
      setMessage(
        "Failed to add employee: " + (error.response?.data?.error || "Server error")
      );
    }
  };

  return (
    <div className="page-container">
      <HRSidebar />
      <div className="add-employee-container" style={{ maxHeight: "90vh", overflowY: "auto" }}>
        <h2>Add Employee</h2>
        <form onSubmit={handleSubmit} className="add-employee-form">
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              name="username"
              placeholder="Enter username"
              value={employee.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              name="name"
              placeholder="Enter employee's name"
              value={employee.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              placeholder="Enter employee's email"
              value={employee.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone Number:</label>
            <input
              type="number"
              name="phone"
              placeholder="Enter phone number"
              value={employee.phone}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Position:</label>
            <input
              type="text"
              name="position"
              placeholder="Enter employee's position"
              value={employee.position}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Department:</label>
            <input
              type="text"
              name="department"
              placeholder="Enter department"
              value={employee.department}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Joining Date:</label>
            <input
              type="date"
              name="joiningDate"
              value={employee.joiningDate}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Salary:</label>
            <input
              type="number"
              name="salary"
              placeholder="Enter employee's salary"
              value={employee.salary}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Resume:</label>
            <input
              type="file"
              name="resume"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileChange}
            />
          </div>
          <button type="submit">Add Employee</button>
          <p className="message">{message}</p>
        </form>
      </div>
    </div>
  );
};

export default AddEmployee;
