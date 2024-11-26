const express = require("express");
const Employee = require("../models/Employee");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken")
const multer = require('multer')
const path = require('path')
const cron = require("node-cron");


const router = express.Router();

// Configure multer to store files in a 'uploads' folder
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, '../uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  });
  
  const upload = multer({ storage: storage });


// Middleware to verify HR token
const verifyHRToken = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ error: "Access denied, token missing!" });
  
    try {
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      req.hr = verified; // Add HR details from token
      next();
    } catch (err) {
      res.status(400).json({ error: "Invalid token!" });
    }
  };

// Helper function to generate a random password
const generateRandomPassword = (length = 8) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };
  
  
  // Configure Nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: "Gmail", // You can use other services like Outlook, or custom SMTP
    auth: {
      user: process.env.EMAIL, // Replace with your email
      pass: process.env.EMAIL_PASSWORD, // Replace with your email password or app password
    },
  });
  
  // Route to add an employee and send email
  router.post("/employees", verifyHRToken, upload.single("resume"), async (req, res) => {
    const { username, name, email, phone, position, department, joiningDate, salary } = req.body;
    const resume = req.file ? req.file.path : null; // Store file path if a file is uploaded
  
    // Validation
    if (!username || !name || !email || !phone || !position || !department || !joiningDate || !salary) {
      return res.status(400).json({ error: "All fields are required!" });
    }
  
    try {
      const password = generateRandomPassword();
  
      const newEmployee = new Employee({
        username,
        name,
        email,
        phone,
        position,
        department,
        joiningDate,
        salary,
        password,
        resume,
        currentSalary: salary
      });
      await newEmployee.save();
  
      // Send Emailhttp://localhost:3000/employee/login"
      const mailOptions = {
        from: '"HR Department" <your-email@gmail.com>', // Sender's email
        to: email, // Employee's email
        subject: "Welcome to the Company! Your Login Credentials",
        html: `
          <p>Dear ${name},</p>
          <p>Welcome to the company! Here are your login credentials:</p>
          <ul>
            <li><strong>Username:</strong> ${username}</li>
            <li><strong>Password:</strong> ${password}</li>
          </ul>
          <p>Please keep this information secure and change your password after logging in for the first time.</p>
          <a href="http://localhost:3000/employee/login">Click here to login!!</a>
          <p>Best regards,</p>
          <p>HR Department</p>
        `,
      };
  
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error("Error sending email:", err);
          return res.status(500).json({ error: "Failed to send email!" });
        } else {
          console.log("Email sent:", info.response);
          return res.json({
            message: "Employee added successfully, and email sent!",
            password, // Optionally send the password back for HR reference
          });
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error!" });
    }
  });
  
  
  
  router.post("/login", (req, res) => {
    const { username, password } = req.body;
  
    if (username === process.env.HR_USERNAME && password === process.env.HR_PASSWORD) {
      const token = jwt.sign({ role: "HR" }, process.env.JWT_SECRET);
      return res.status(200).json({ message: "Login successful", token });
    }
  
    res.status(401).json({ error: "Invalid HR credentials" });
  });
  

  router.get("/employees", verifyHRToken, async (req, res) => {
    try {
      const employees = await Employee.find();
      res.status(200).json(employees);
    } catch (error) {
      console.log(error)
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  });
  
// Get Employee Details by ID
router.get("/employee/:id", verifyHRToken, async (req, res) => {
    try {
      const employee = await Employee.findById(req.params.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  
  // Get All Leave Applications
  router.get("/leave-applications", verifyHRToken, async (req, res) => {
    try {
      // Fetch employees and their leave applications
      const employees = await Employee.find(
        {},
        "name email position department leaveApplications"
      );
  
      // Flatten and map leave applications with employee details
      const leaveApplications = employees.flatMap((employee) =>
        (employee.leaveApplications || []).map((application) => ({
          employeeId: employee._id,
          name: employee.name,
          email: employee.email,
          position: employee.position,
          department: employee.department,
          ...application._doc, // Spread application data
        }))
      );
  
      // Sort applications by date (most recent first) and move past dates to the end
      const today = new Date().setHours(0, 0, 0, 0); // Get today's date without time
      const sortedApplications = leaveApplications.sort((a, b) => {
        const dateA = new Date(a.date).setHours(0, 0, 0, 0);
        const dateB = new Date(b.date).setHours(0, 0, 0, 0);
  
        // Check if dates are past
        const isPastA = dateA < today;
        const isPastB = dateB < today;
  
        if (isPastA && !isPastB) return 1; // Move past dates to the end
        if (!isPastA && isPastB) return -1; // Keep upcoming dates at the top
  
        // If both are past or both are upcoming, sort by most recent first
        return dateA - dateB;
      });
  
  
      res.json({ leaveApplications: sortedApplications });
    } catch (error) {
      console.error("Error fetching leave applications:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  
  // Approve or Reject Leave Application
  router.put("/leave-applications/:id", verifyHRToken, async (req, res) => {
    const { status, employeeId } = req.body; // Status can be "Approved" or "Rejected"
  
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
  
    try {
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
  
      const leaveApplication = employee.leaveApplications.id(req.params.id);
      if (!leaveApplication) {
        return res.status(404).json({ message: "Leave application not found" });
      }
      leaveApplication.status = status; // Update the leave status
      if (status == "Rejected"){
        if (totalLeavesThisMonth > 4) {
          const deductionPerLeave = Math.round(employee.salary / 30); // Assuming 30 working days
          employee.currentSalary += deductionPerLeave;
        }
      }
      await employee.save(); // Save changes to the employee document
  
      res.json({ message: `Leave application ${status.toLowerCase()} successfully!` });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  
// Schedule the job to run at 00:00 on the 1st of every month
cron.schedule("0 0 1 * *", async () => {
    try {
      console.log("Resetting currentSalary to salary at the start of the month...");
      
      // Fetch all employees
      const employees = await Employee.find();
  
      // Update each employee's currentSalary
      for (const employee of employees) {
        employee.currentSalary = employee.salary;
        await employee.save();
      }
  
      console.log(`Updated salaries for ${employees.length} employees.`);
    } catch (error) {
      console.error("Error resetting current salaries:", error);
    }
  });

module.exports = router