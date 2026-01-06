import express from "express";
import { createEmployee, employeeLogin, getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee, forgetEmployeePassword, updateEmployeeIsActive } from "../controllers/employee.controller.js";

import employeeAuth from "../middleware/employeeAuth.js";
import upload from "../middleware/multer.js"; // image upload middleware
import { verifyAdminToken } from "../middleware/verifyAdminToken.js";

const empRoute = express.Router();

/* =========================
   PUBLIC ROUTES
========================= */

empRoute.post("/create", verifyAdminToken, upload.single("profilePhoto"), createEmployee);
empRoute.post("/login", employeeLogin);
empRoute.get("/get",verifyAdminToken, getAllEmployees);
empRoute.get("/get/:id",verifyAdminToken, getEmployeeById);
empRoute.put("/update/:id",verifyAdminToken, upload.single("profilePhoto"), updateEmployee);
empRoute.delete("/delete/:id",verifyAdminToken, deleteEmployee);
empRoute.patch("/forget-password", employeeAuth, forgetEmployeePassword);
empRoute.get("/profile", employeeAuth, (req, res) => {
  res.status(200).json({ message: "Employee profile", employee: req.employee });
});
empRoute.get("/employee/:id/status", updateEmployeeIsActive);

export default empRoute;
