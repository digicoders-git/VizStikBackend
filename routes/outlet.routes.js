import express from "express";
import {
  createOutlet,
  getMyOutlets,
  getOutletById,
  updateOutlet,
  deleteOutlet
} from "../controllers/outlet.controller.js";

import employeeAuth from "../middleware/employeeAuth.js";
import upload from "../middleware/multer.js";

const outletRoute = express.Router();

outletRoute.post(
  "/create",
  employeeAuth,
  upload.array("outletImages", 8),
  createOutlet
);

outletRoute.get("/", employeeAuth, getMyOutlets);
outletRoute.get("/:id", employeeAuth, getOutletById);

outletRoute.put(
  "/update/:id",
  employeeAuth,
  upload.array("outletImages", 8),
  updateOutlet
);

outletRoute.delete("/:id", employeeAuth, deleteOutlet);

export default outletRoute;
