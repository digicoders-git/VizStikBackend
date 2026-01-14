import express from "express";
import { createBranch } from "../controllers/branch.controller.js";

const branchRoute = express.Router();

branchRoute.post("/create", createBranch);

export default branchRoute;
