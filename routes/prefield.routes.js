import express from 'express'
import { getAllPrefields, getDataByCode, getAllPrefieldsAdmin, downloadPrefieldsExcel } from '../controllers/prefield.controller.js';

const prefieldsRoute = express.Router()

prefieldsRoute.get("/", getAllPrefields);
prefieldsRoute.get("/admin/all", getAllPrefieldsAdmin);
prefieldsRoute.get("/admin/download", downloadPrefieldsExcel);
prefieldsRoute.post("/getData", getDataByCode);

export default prefieldsRoute
