import express from "express";
import { createLoginUser } from "../controllers/login.controller.js";

const loginRoute = express.Router();

loginRoute.post("/create", createLoginUser);

export default loginRoute;
