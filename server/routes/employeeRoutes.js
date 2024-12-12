const express = require("express");
const bcrypt = require("bcrypt");
const Employee = require("../models/Employee");
const jwt = require("jsonwebtoken")


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

const calculateLeaveDays = (start, end) => {
  let leaveDays = 0;
  let currentDate = new Date(start);

  while (currentDate <= end) {
    const day = currentDate.getDay();
    if (day !== 0) { // Exclude Sundays (0)
      leaveDays++;
    } 
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return leaveDays;
};

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const employee = await Employee.findOne({ username });
    if (!employee){
      console.log(username, password)
      return res.status(404).json({ error: "User not found" });
    } 
    
    const isPasswordValid = await bcrypt.compare(password, employee.password);
    // const isPasswordValid = password == employee.password
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
  const { startDate, endDate, reason, type } = req.body;

  if (!startDate || !endDate || !reason || !type) {
    return res.status(400).json({ message: "Start date, end date, reason, and leave type are required" });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  try {
    const employee = await Employee.findById(req.employee.id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

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

    if (overlappingLeave && overlappingLeave.status === "Approved") {
      return res.status(400).json({
        message: "Leave application overlaps with an existing leave",
      });
    }

    // Calculate number of leave days
    const leaveDays = calculateLeaveDays(start,end)

    // Validate leave type and update balances or salary
    let leaveBalanceKey;
    switch (type) {
      case "Sick Leave":
        leaveBalanceKey = "sickLeave";
        break;
      case "Casual Leave":
        leaveBalanceKey = "casualLeave";
        break;
      case "Annual Leave":
        leaveBalanceKey = "annualLeave";
        break;
      default:
        return res.status(400).json({ message: "Invalid leave type" });
    }

    if (leaveBalanceKey) {
      if (employee.leaveBalances[leaveBalanceKey] >= leaveDays) {
        // Deduct from the respective leave balance
        employee.leaveBalances[leaveBalanceKey] -= leaveDays;
        totalDeduction = 0
      } else {
        const excessDays = leaveDays - employee.leaveBalances[leaveBalanceKey];
        employee.leaveBalances[leaveBalanceKey] = 0;

        // Handle unpaid leave for excess days
        const deductionPerDay = Math.round(employee.salary / 30); // Assuming 30 working days
        const totalDeduction = deductionPerDay * excessDays;

        // Add the leave application
        employee.leaveApplications.push({ startDate: start, endDate: end, reason, type, totalDeduction });
        await employee.save();


        return res.status(200).json({
          message: `Leave partially approved with salary deduction for ${excessDays} day(s). Total deduction: ₹${totalDeduction}`,
          remainingSalary: employee.currentSalary,
          leaveBalances: employee.leaveBalances,
        });
      }
    }

    // Add the leave application
    employee.leaveApplications.push({ startDate: start, endDate: end, reason, type, totalDeduction });
    await employee.save();

    return res.json({
      message: "Leave application submitted successfully!",
      leaveBalances: employee.leaveBalances,
      remainingSalary: employee.currentSalary,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/leave-history", verifyEmployeeToken, async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json({ leaveApplications: employee.leaveApplications, leaveBalances: employee.leaveBalances });
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

    const isMatch = await bcrypt.compare(currentPassword, employee.password);
    // const isMatch = currentPassword == employee.password;
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    // const salt = await bcrypt.genSalt(10);
    // employee.password = await bcrypt.hash(newPassword, salt);
    await employee.save();

    res.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
});

router.get("/notifications", verifyEmployeeToken, async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee.id).select("notifications");
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    recentApplication = employee.notifications

    const notification = {
      message: `Your leave application from ${new Date(recentApplication.startDate).toLocaleDateString()} to ${new Date(recentApplication.endDate).toLocaleDateString()} was ${recentApplication.status.toLowerCase()}.`,
      status: recentApplication.status,
    };

    res.json({ notification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});



module.exports = router;
