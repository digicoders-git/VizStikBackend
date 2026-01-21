import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";

import connectDB from "./config/db.js";

// routes
import { adminRoute } from "./routes/admin.route.js";
import empRoute from "./routes/employee.routes.js";
import shopRoute from "./routes/shop.routes.js";
import prefieldsRoute from "./routes/prefield.routes.js";
import outletRoute from "./routes/outlet.routes.js";
import branchRoute from "./routes/branch.routes.js";
import subAdminRoute from "./routes/subAdmin.route.js";
import loginRoute from "./routes/login.routes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

/* =========================
   SECURITY (HELMET)
========================= */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // ✅ FIX
  })
);

/* =========================
   CORS CONFIG
========================= */
app.use(
  cors({
    origin: true, // allow all origins (frontend, postman, etc.)
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* =========================
   BODY PARSERS
========================= */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* =========================
   STATIC FILES (UPLOADS)
   This is the MOST IMPORTANT FIX
========================= */
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

/* =========================
   DATABASE
========================= */
await connectDB();

/* =========================
   ROUTES
========================= */
app.use("/admin", adminRoute);
app.use("/employee", empRoute);
app.use("/shop", shopRoute);
app.use("/prefields", prefieldsRoute);
app.use("/outlets", outletRoute);
app.use("/branch", branchRoute);
app.use("/subAdmin", subAdminRoute);
app.use("/admins", loginRoute);

/* =========================
   404 HANDLER
========================= */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/* =========================
   SERVER START
========================= */
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
