const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const EmployeeSchema = new mongoose.Schema({
  username:{
    type: String,
    required: true,
    unique:true
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  position: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  joiningDate: {
    type: Date,
    required: true,
  },
  salary: {
    type: Number,
    required: true,
  },
  currentSalary: {
    type: Number,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  leaveApplications: [
    {
      date: Date,
      reason: String,
      status: { type: String, default: "Pending" }, // Pending, Approved, Rejected
    },
  ],
  resume: { type: String, required: false }, 
}, { timestamps: true });



// Middleware to hash password before saving
EmployeeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


module.exports = mongoose.model("Employee", EmployeeSchema);