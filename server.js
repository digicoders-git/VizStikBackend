import express from 'express'
import connectDB from './config/db.js';
import fs from "fs";
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { adminRoute } from './routes/admin.route.js';
import empRoute from './routes/employee.routes.js';
import shopRoute from './routes/shop.routes.js';
dotenv.config()

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

await connectDB();

app.use('/admin',adminRoute)
app.use('/employee',empRoute)
app.use('/shop',shopRoute)


// 404 handler
app.use((req, res) =>
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }));
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));