import express from "express";
import {
  createShop,
  getAllShops,
  getShopById,
  updateShop,
  deleteShop,
  updateShopIsActive
} from "../controllers/shop.controller.js";

import upload from "../middleware/multer.js";
import employeeAuth from "../middleware/employeeAuth.js";
import eitherAuth from "../middleware/eitherAuth.js";

const shopRoute = express.Router();

/* =========================
   SHOP ROUTES (EMPLOYEE)
========================= */

/**
 * @route   POST /api/shop/create
 * @desc    Employee creates shop (ownerImage + 2 shopImages)
 * @access  Employee (Protected)
 */
shopRoute.post(
  "/create",
  employeeAuth,
  upload.fields([
    { name: "ownerImage", maxCount: 1 },
    { name: "shopImages", maxCount: 2 }
  ]),
  createShop
);

/**
 * @route   GET /api/shop/get
 * @desc    Get all shops (query based)
 * @access  Employee (Protected)
 */
shopRoute.get(
  "/get",
  eitherAuth,
  getAllShops
);

/**
 * @route   GET /api/shop/get/:id
 * @desc    Get single shop by ID
 * @access  Employee (Protected)
 */
shopRoute.get(
  "/get/:id",
  eitherAuth,
  getShopById
);

/**
 * @route   PUT /api/shop/update/:id
 * @desc    Update shop (fields only, images optional)
 * @access  Employee (Protected)
 */
shopRoute.put(
  "/update/:id",
  eitherAuth,
  upload.fields([
    { name: "ownerImage", maxCount: 1 },
    { name: "shopImages", maxCount: 2 }
  ]),
  updateShop
);

/**
 * @route   DELETE /api/shop/delete/:id
 * @desc    Delete shop (only creator employee)
 * @access  Employee (Protected)
 */
shopRoute.delete(
  "/delete/:id",
  eitherAuth,
  deleteShop
);
shopRoute.get("/status/:id",eitherAuth, updateShopIsActive);

export default shopRoute;
