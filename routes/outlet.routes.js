import express from "express";
import {
  createOutlet,
  getMyOutlets,
  getOutletById,
  updateOutlet,
  deleteOutlet,
  getOutletDashboardStats
} from "../controllers/outlet.controller.js";

import employeeAuth from "../middleware/employeeAuth.js";
import upload from "../middleware/multer.js";

const outletRoute = express.Router();

outletRoute.get("/dashboard", employeeAuth, getOutletDashboardStats);
outletRoute.post(
  "/create",
  employeeAuth,
  upload.array("outletImages", 8),
  createOutlet
);

outletRoute.get("/:id", employeeAuth, getOutletById);

outletRoute.put(
  "/update/:id",
  employeeAuth,
  upload.array("outletImages", 8),
  updateOutlet
);

outletRoute.delete("/:id", employeeAuth, deleteOutlet);
outletRoute.get("/", employeeAuth, getMyOutlets);

export default outletRoute;
