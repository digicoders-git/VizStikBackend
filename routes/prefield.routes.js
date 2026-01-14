import express from 'express'
import { getAllPrefields, getDataByCode } from '../controllers/prefield.controller.js';

const prefieldsRoute = express.Router()

prefieldsRoute.get("/", getAllPrefields);
prefieldsRoute.post("/getData", getDataByCode);
export default prefieldsRoute
