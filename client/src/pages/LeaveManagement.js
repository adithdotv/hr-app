import React, { useEffect, useState } from "react";
import axios from "axios";
import HRSidebar from "../components/HRSidebar"; // Import the sidebar component
import "./LeaveManagement.css";

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const token = localStorage.getItem("hrToken");
        const res = await axios.get("http://localhost:5000/api/hr/leave-applications", {
          headers: { Authorization: token },
        
        });
        setLeaves(res.data.leaveApplications);
        console.log(leaves)
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Error fetching leave applications");
      }
    };
    fetchLeaves();

  }, [leaves]);

  const handleAction = async (id, employeeId, status) => {
    try {
      const token = localStorage.getItem("hrToken");
      await axios.put(
        `http://localhost:5000/api/hr/leave-applications/${id}`,
        { status, employeeId},
        {
          headers: { Authorization: token },
        }
      );
      setLeaves((prev) =>
        prev.map((leave) =>
          leave._id === id ? { ...leave, status } : leave
        )
      );
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error updating leave status");
    }
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="page-container">
      <HRSidebar />
      <div className="content-container">
        <h1>Leave Applications</h1>
        {leaves.length === 0 ? (
          <p>No leave applications to review.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => (
                <tr key={leave._id}>
                  <td>{leave.name}</td>
                  <td>{leave.email}</td>
                  <td>{leave.position}</td>
                  <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                  <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                  <td>{leave.reason}</td>
                  <td className={leave.status.toLowerCase()}>{leave.status}</td>
                  <td>
                    {leave.status === "Pending" && (
                      <>
                        <button
                          className="approve-btn"
                          onClick={() => handleAction(leave._id, leave.employeeId, "Approved")}
                        >
                          Approve
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => handleAction(leave._id, leave.employeeId,  "Rejected")}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LeaveManagement;
