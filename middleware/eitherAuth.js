import jwt from "jsonwebtoken";
import Employee from "../model/employee.model.js";
import Admin from "../model/admin.models.js";
import Login from "../model/login.model.js";

const eitherAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No token provided"
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /* ================= TRY EMPLOYEE ================= */
    const employee = await Employee.findById(decoded.id);
    if (employee) {
      if (!employee.isActive) {
        return res.status(403).json({
          message: "Employee account disabled"
        });
      }

      req.employee = employee;
      req.employeeId = employee._id;
      req.userType = "employee";
      return next();
    }

    /* ================= TRY ADMIN ================= */
    const admin = await Admin.findById(decoded.id);
    if (admin) {
      req.admin = admin;
      req.adminId = admin._id;
      req.userType = "admin";
      return next();
    }

    /* ================= TRY LOGIN USER (SUB-ADMIN) ================= */
    const loginUser = await Login.findById(decoded.id);
    if (loginUser) {
      req.admin = loginUser;
      req.adminId = loginUser._id;
      req.userType = "admin";
      return next();
    }

    return res.status(401).json({
      message: "Invalid token"
    });

  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized",
      error: error.message
    });
  }
};

export default eitherAuth;
