import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import "./LeaveApplication.css";

const LeaveApplication = () => {
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    reason: "",
    type: "", // New field for leave type
  });
  const [message, setMessage] = useState("");
  const [totalLeaves, setTotalLeaves] = useState();
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState({});

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isSunday = (date) => {
    const day = new Date(date).getDay();
    return day === 0; // 0 represents Sunday in JavaScript's `getDay()`
  };

  const fetchLeaveHistory = async () => {
    try {
      const token = localStorage.getItem("employeeToken");
      const res = await axios.get("http://localhost:5000/api/employees/leave-history", {
        headers: { Authorization: token },
      });
      setLeaveHistory(res.data.leaveApplications);
      setLeaveBalances(res.data.leaveBalances)
    } catch (err) {
      console.error("Error fetching leave history:", err.response?.data?.message || err.message);
    }
  };

  useEffect(() => {
    fetchLeaveHistory(); // Fetch leave history on component mount
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Check if the selected date is a Sunday
    if ((name === "startDate" || name === "endDate") && isSunday(value)) {
      setMessage("You cannot select a Sunday as a leave date.");
      return;
    }

    setMessage(""); // Clear any previous messages
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("employeeToken");
      const res = await axios.post(
        "http://localhost:5000/api/employees/apply-leave",
        formData,
        {
          headers: { Authorization: token },
        }
      );
      setMessage(res.data.message);
      setTotalLeaves(res.data.totalLeavesThisMonth);
      setFormData({ startDate: "", endDate: "", reason: "", type: "" });
      fetchLeaveHistory(); // Refresh leave history after successful submission
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Error submitting leave application"
      );
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="leave-application-content">
        <h2>Apply for Leave</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              min={getTodayDate()}
              required
            />
          </div>
          <div>
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              min={formData.startDate || getTodayDate()} // Ensure end date is after start date
              required
            />
          </div>
          <div>
            <label htmlFor="type">Leave Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="">Select Leave Type</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Casual Leave">Casual Leave</option>
              <option value="Annual Leave">Annual Leave</option>
            </select>
          </div>
          <div>
            <label htmlFor="reason">Reason</label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              rows="4"
              required
            />
          </div>
          <button type="submit">Submit</button>
        </form>
        {message && <p className="message">{message}</p>}
        {totalLeaves && <p className="message">Total Leaves on the Applied Month: {totalLeaves}</p>}

        <h3>Total Leaves Left</h3>
        <p>Sick Leave Left:{leaveBalances.sickLeave}</p>
        <p>Casual Leave Left:{leaveBalances.casualLeave}</p>
        <p>Annual Leave Left:{leaveBalances.annualLeave}</p>
        <h3>Leave History</h3>
        {leaveHistory.length === 0 ? (
          <p>No leave applications found.</p>
        ) : (
          <table className="leave-history-table">
            <thead>
              <tr>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaveHistory.map((leave, index) => (
                <tr key={index}>
                  <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                  <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                  <td>{leave.type}</td>
                  <td>{leave.reason}</td>
                  <td className={leave.status.toLowerCase()}>{leave.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LeaveApplication;
