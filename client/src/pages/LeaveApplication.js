import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import "./LeaveApplication.css";

const LeaveApplication = () => {
  const [formData, setFormData] = useState({
    date: "",
    reason: "",
  });
  const [message, setMessage] = useState("");
  const [totalLeaves, setTotalLeaves] = useState();
  const [leaveHistory, setLeaveHistory] = useState([]); // State for leave history

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchLeaveHistory = async () => {
    try {
      const token = localStorage.getItem("employeeToken");
      const res = await axios.get("http://localhost:5000/api/employees/leave-history", {
        headers: { Authorization: token },
      });
      setLeaveHistory(res.data.leaveApplications);
    } catch (err) {
      console.error("Error fetching leave history:", err.response?.data?.message || err.message);
    }
  };

  useEffect(() => {
    fetchLeaveHistory(); // Fetch leave history on component mount
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      setFormData({ date: "", reason: "" });
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
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              min={getTodayDate()}
              required
            />
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
        {totalLeaves && <p className="message">Total Leaves this Month: {totalLeaves}</p>}

        <h3>Leave History</h3>
        {leaveHistory.length === 0 ? (
          <p>No leave applications found.</p>
        ) : (
          <table className="leave-history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaveHistory.map((leave, index) => (
                <tr key={index}>
                  <td>{new Date(leave.date).toLocaleDateString()}</td>
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
