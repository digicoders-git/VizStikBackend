import express from "express";
import {
  createEmployee,
  employeeLogin,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
} from "../controllers/employee.controller.js";

import employeeAuth from "../middleware/employeeAuth.js";
import upload from "../middleware/multer.js"; // image upload middleware
import { verifyAdminToken } from "../middleware/verifyAdminToken.js";

const empRoute = express.Router();

/* =========================
   PUBLIC ROUTES
========================= */

empRoute.post("/create",verifyAdminToken,upload.single("profilePhoto"),createEmployee);
empRoute.post("/login", employeeLogin);
empRoute.get("/get", getAllEmployees);
empRoute.get("/get/:id", getEmployeeById);
empRoute.put("/update/:id",upload.single("profilePhoto"),updateEmployee);
empRoute.delete("/delete/:id", deleteEmployee);
empRoute.get("/profile", employeeAuth, (req, res) => {res.status(200).json({message: "Employee profile",employee: req.employee});
});

export default empRoute;
