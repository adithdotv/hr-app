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
  const { date, reason } = req.body;

  if (!date || !reason) {
    return res.status(400).json({ message: "Date and reason are required" });
  }

  const selectedDate = new Date(date);

  if (selectedDate < new Date()) {
    return res.status(400).json({ message: "Cannot select a past date" });
  }

  try {
    const employee = await Employee.findById(req.employee.id);

    // Check if leave already exists for the given date
    const existingLeave = employee.leaveApplications.find(
      (application) => application.date.toISOString() === selectedDate.toISOString()
    );
    if (existingLeave) {
      return res.status(400).json({ message: "Leave application already exists for this date" });
    }

    const appliedDate = new Date(date);
    const appliedMonth = appliedDate.getMonth();
    const appliedYear = appliedDate.getFullYear();

    const monthlyLeaves = employee.leaveApplications.filter((application) => {
      const leaveDate = new Date(application.date);
      return leaveDate.getMonth() === appliedMonth && leaveDate.getFullYear() === appliedYear;
    });
    
    const totalLeavesThisMonth = monthlyLeaves.length;

    // Check if the employee exceeds the 4 leaves per month limit
    if (totalLeavesThisMonth >= 4) {
      const deductionPerLeave = Math.round(employee.salary / 30); // Assuming 30 working days
      employee.currentSalary -= deductionPerLeave;

      employee.leaveApplications.push({ date: selectedDate, reason });
      await employee.save();
      return res.status(200).json({
        message: `Leave applied with salary deduction! Total deduction: ₹${deductionPerLeave}`,
        remainingSalary: employee.currentSalary,
        totalLeavesThisMonth: totalLeavesThisMonth + 1,
      });
    }

    // Add the new leave application
    await employee.save();

    return res.json({
      message: "Leave application submitted successfully!",
      totalLeavesThisMonth: totalLeavesThisMonth + 1,
      remainingLeaves: Math.max(0, 4 - (totalLeavesThisMonth + 1)),
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
