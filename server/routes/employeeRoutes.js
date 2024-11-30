const express = require("express");
const bcrypt = require("bcrypt");
const Employee = require("../models/Employee");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken")
const multer = require('multer')
const path = require('path')
const cron = require("node-cron");


const router = express.Router();


const verifyEmployeeToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Access denied, token missing!" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.employee = verified; // Add employee details from the token
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token!" });
  }
};


router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const employee = await Employee.findOne({ username });
    if (!employee) return res.status(404).json({ error: "User not found" });
    
    // const isPasswordValid = await bcrypt.compare(password, employee.password);
    const isPasswordValid = password == employee.password
    if (!isPasswordValid) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: employee._id }, process.env.JWT_SECRET);
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: "Server error" });
  }
});


// Route to fetch employee details
router.get("/employee", verifyEmployeeToken, async (req, res) => {
  try {
    // Find employee details in the database using the token payload
    const employee = await Employee.findById(req.employee.id).select("-password"); // Exclude password field
    if (!employee) return res.status(404).json({ error: "Employee not found!" });

    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: "Server error!" });
  }
});

// Submit a Leave Application
router.post("/apply-leave", verifyEmployeeToken, async (req, res) => {
  const { startDate, endDate, reason } = req.body;

  if (!startDate || !endDate || !reason) {
    return res.status(400).json({ message: "Start date, end date, and reason are required" });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // if (start < new Date() || end < start) {
  //   return res.status(400).json({
  //     message: "Start date cannot be in the past, and end date cannot be before the start date",
  //   });
  // }

  try {
    const employee = await Employee.findById(req.employee.id);

    // Check for overlapping leave applications
    const overlappingLeave = employee.leaveApplications.find((application) => {
      const leaveStart = new Date(application.startDate);
      const leaveEnd = new Date(application.endDate);
      return (
        (start >= leaveStart && start <= leaveEnd) || // Start date overlaps
        (end >= leaveStart && end <= leaveEnd) || // End date overlaps
        (start <= leaveStart && end >= leaveEnd) // Completely overlaps
      );
    });

    if (overlappingLeave) {
      return res.status(400).json({
        message: "Leave application overlaps with an existing leave",
      });
    }

    // Calculate number of leave days
    const leaveDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Check for monthly leave limit
    const appliedMonth = start.getMonth();
    const appliedYear = start.getFullYear();

    const monthlyLeaves = employee.leaveApplications.filter((application) => {
      const leaveStart = new Date(application.startDate);
      return (
        leaveStart.getMonth() === appliedMonth && leaveStart.getFullYear() === appliedYear
      );
    });

    const totalLeavesThisMonth = monthlyLeaves.reduce((sum, leave) => {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      return (
        sum + Math.ceil((leaveEnd - leaveStart) / (1000 * 60 * 60 * 24)) + 1
      );
    }, 0);

    if (totalLeavesThisMonth + leaveDays > 4) {
      const excessDays = totalLeavesThisMonth + leaveDays - 4;
      const deductionPerDay = Math.round(employee.salary / 30); // Assuming 30 working days
      const totalDeduction = deductionPerDay * excessDays;

      employee.currentSalary -= totalDeduction;
      employee.leaveApplications.push({ startDate: start, endDate: end, reason });
      await employee.save();

      return res.status(200).json({
        message: `Leave applied with salary deduction! Total deduction: ₹${totalDeduction}`,
        remainingSalary: employee.currentSalary,
        totalLeavesThisMonth: totalLeavesThisMonth + leaveDays,
      });
    }

    // Add the leave application
    employee.leaveApplications.push({ startDate: start, endDate: end, reason });
    await employee.save();

    return res.json({
      message: "Leave application submitted successfully!",
      totalLeavesThisMonth: totalLeavesThisMonth + leaveDays,
      remainingLeaves: Math.max(0, 4 - (totalLeavesThisMonth + leaveDays)),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/leave-history", verifyEmployeeToken, async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee.id, "leaveApplications");
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json({ leaveApplications: employee.leaveApplications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



router.put("/change-password", verifyEmployeeToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const employeeId = req.employee.id;

  try {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    const isMatch = currentPassword == employee.password;
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    const salt = await bcrypt.genSalt(10);
    employee.password = await bcrypt.hash(newPassword, salt);
    await employee.save();

    res.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
