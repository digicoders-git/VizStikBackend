import express from "express";
import { createEmployee, employeeLogin, getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee, forgetEmployeePassword, updateEmployeeIsActive, getEmployeeWithShops, sendLoginOtp, verifyLoginOtp } from "../controllers/employee.controller.js";

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
empRoute.get("/get-with-shops/:id",verifyAdminToken, getEmployeeWithShops);
empRoute.put("/update/:id",verifyAdminToken, upload.single("profilePhoto"), updateEmployee);
empRoute.delete("/delete/:id",verifyAdminToken, deleteEmployee);
empRoute.patch("/forget-password", employeeAuth, forgetEmployeePassword);
empRoute.get("/profile", employeeAuth, (req, res) => {
  res.status(200).json({ message: "Employee profile", employee: req.employee });
});
empRoute.get("/employee/:id/status", updateEmployeeIsActive);
empRoute.post("/login-password", employeeLogin);
empRoute.post("/login-otp-send", sendLoginOtp);
empRoute.post("/login-otp-verify", verifyLoginOtp);

export default empRoute;
