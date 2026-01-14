import jwt from "jsonwebtoken";
import Employee from "../model/employee.model.js";

const employeeAuth = async (req, res, next) => {
  try {
    // 1️⃣ Token extract
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No token provided"
      });
    }

    const token = authHeader.split(" ")[1];

    // 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3️⃣ Find employee
    const employee = await Employee.findById(decoded.id);

    if (!employee) {
      return res.status(401).json({
        message: "Invalid token (employee not found)"
      });
    }

    if (!employee.isActive) {
      return res.status(403).json({
        message: "Account disabled"
      });
    }

    // 4️⃣ Attach employee to request
    req.employee = employee;
    req.employeeId = employee._id;
    // console.log(req.employee,req.employeeId)

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized",
      error: error.message
    });
  }
};

export default employeeAuth;
