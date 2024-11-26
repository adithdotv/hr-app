import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const Home = () => {
  return (
    <div className="home-container">
      <div className="main-content">
        <h1 className="title">Employee Management System</h1>
        <p className="subtitle">Effortlessly manage employee data and operations.</p>
        <div className="options">
          <Link to="/employee/login" className="employee-login">
            Login as Employee
          </Link>
          <Link to="/hr/login" className="hr-login">
            Login as HR
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
