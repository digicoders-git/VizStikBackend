import express from 'express'
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import fs from "fs";
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { adminRoute } from './routes/admin.route.js';
import empRoute from './routes/employee.routes.js';
import shopRoute from './routes/shop.routes.js';
import prefieldsRoute from './routes/prefield.routes.js';
import outletRoute from './routes/outlet.routes.js';
import branchRoute from './routes/branch.routes.js';
import subAdminRoute from './routes/subAdmin.route.js';
import loginRoute from './routes/login.routes.js';
dotenv.config()

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()
const port = process.env.PORT || 3000
app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

await connectDB();

app.use('/admin', adminRoute)
app.use('/employee', empRoute)
app.use('/shop', shopRoute)
app.use('/prefields', prefieldsRoute)
app.use('/outlets', outletRoute)
app.use('/branch', branchRoute)
app.use('/subAdmin', subAdminRoute)
app.use('/admins', loginRoute)

//done
// 404 handler
app.use((req, res) =>
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }));
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
