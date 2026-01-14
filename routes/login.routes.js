import express from "express";
import { createLoginUser, loginUser } from "../controllers/login.controller.js";
import { getAllData } from "../controllers/allData.controller.js";

const loginRoute = express.Router();

loginRoute.post("/create", createLoginUser);
loginRoute.post("/login", loginUser);
loginRoute.post("/data", getAllData);

export default loginRoute;
