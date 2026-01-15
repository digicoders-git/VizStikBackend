import express from "express";
import { createBranch, getBranchStats, getBranchRoleUsers } from "../controllers/branch.controller.js";

const branchRoute = express.Router();

branchRoute.post("/create", createBranch);
branchRoute.get("/stats", getBranchStats);
branchRoute.get("/users", getBranchRoleUsers);

export default branchRoute;
