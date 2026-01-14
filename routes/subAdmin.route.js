import express from 'express'
import { subLogin } from '../controllers/subadmin.controller.js'

const subAdminRoute = express.Router()

subAdminRoute.post('/get',subLogin)

export default subAdminRoute