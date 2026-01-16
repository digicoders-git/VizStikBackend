import Shop from "../model/shop.model.js";
import Employee from "../model/employee.model.js";
import { compressImage } from "../utils/imageResizer.js";


function isValidIndianMobile(number) {
  const num = String(number);

  // length 10 honi chahiye
  if (num.length !== 10) return false;

  // only digits
  for (let i = 0; i < num.length; i++) {
    if (num[i] < "0" || num[i] > "9") {
      return false;
    }
  }

  // starting digit 6,7,8,9
  const first = num[0];
  if (first !== "6" && first !== "7" && first !== "8" && first !== "9") {
    return false;
  }

  return true;
}
/* =========================
   CREATE SHOP (EMPLOYEE)
========================= */
export const createShop = async (req, res) => {
  try {
    const {
      shopName,
      shopType,
      description,
      ownerName,
      ownerPhone,
      ownerEmail,
      // phone,
      // alternatePhone,
      // email,
      address,
      city,
      state,
      pincode,
      country,
      latitude,
      longitude,
      gstNumber,
      openingTime,
      closingTime
    } = req.body;

    // 🔒 Validation
    if (!shopName || !ownerPhone || !address || !latitude || !longitude) {
      return res.status(400).json({
        message: "shopName, phone, address, latitude and longitude are required"
      });
    }

    if (!isValidIndianMobile(ownerPhone)) {
      return res.status(400).json({
        message: "Invalid mobile number"
      });
    }

    // 🔍 Duplicate check in one query
    const duplicateShop = await Shop.findOne({
      $or: [
        { ownerPhone },
        { ownerEmail },
        { gstNumber }
      ]
    });

    if (duplicateShop) {
      if (duplicateShop.ownerPhone === ownerPhone) {
        return res.status(400).json({ message: "phone already registered" });
      }
      if (duplicateShop.ownerEmail === ownerEmail) {
        return res.status(400).json({ message: "email already registered" });
      }
      if (duplicateShop.gstNumber === gstNumber) {
        return res.status(400).json({ message: "GST number already registered" });
      }

      return res.status(400).json({
        message: "Shop already exists"
      });
    }


    /* ================= OWNER IMAGE ================= */
    let ownerImage = { url: "", public_id: "" };

    if (req.files?.ownerImage?.[0]) {
      // 🔥 Image Compression
      await compressImage(req.files.ownerImage[0].path, 50);

      const filename = req.files.ownerImage[0].filename;
      const localPath = `uploads/shops/owner/${filename}`;

      ownerImage = {
        url: `${req.protocol}://${req.get("host")}/${localPath}`,
        public_id: localPath
      };
    }

    /* ================= SHOP IMAGES (MAX 2) ================= */
    let shopImages = [];

    if (req.files?.shopImages) {
      if (req.files.shopImages.length > 2) {
        return res.status(400).json({
          message: "Only 2 shop images are allowed"
        });
      }

      for (const file of req.files.shopImages) {
        // 🔥 Image Compression
        await compressImage(file.path, 50);

        const filename = file.filename;
        const localPath = `uploads/shops/images/${filename}`;

        shopImages.push({
          url: `${req.protocol}://${req.get("host")}/${localPath}`,
          public_id: localPath
        });
      }
    }

    /* ================= CREATE SHOP ================= */
    const shop = await Shop.create({
      shopName,
      shopType,
      description,
      ownerName,
      ownerPhone,
      ownerEmail,
      ownerImage,
      // phone,
      // alternatePhone,
      // email,
      address,
      city,
      state,
      pincode,
      country: country || "India",

      location: {
        latitude: Number(latitude),
        longitude: Number(longitude)
      },

      gstNumber,
      openingTime,
      closingTime,
      shopImages,

      // 🔥 Employee who created shop
      createdBy: req.employeeId
    });

    // 🔥 EMPLOYEE ME SHOP ID ADD KARO
    await Employee.findByIdAndUpdate(req.employeeId, {
      $push: { addedShops: shop._id }
    });

    return res.status(201).json({
      message: "Shop created successfully",
      shop
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};


/* =========================
   GET ALL SHOPS
========================= */
/* =========================
   GET ALL SHOPS (WITH PAGINATION)
========================= */
export const getAllShops = async (req, res) => {
  try {
    const { city, state, shopType, search, date } = req.query;

    // ✅ Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10000000;
    const skip = (page - 1) * limit;

    let query = {};

    if (city) query.city = city;
    if (state) query.state = state;
    if (shopType) query.shopType = shopType;

    // 🔍 Search
    if (search) {
      query.$or = [
        { shopName: { $regex: search, $options: "i" } },
        { ownerName: { $regex: search, $options: "i" } }
      ];
    }

    // 📅 Date filter (NEW)
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      query.createdAt = {
        $gte: startDate,
        $lte: endDate
      };
    }

    // 🔢 Total count
    const total = await Shop.countDocuments(query);

    // 📦 Data
    const shops = await Shop.find(query)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      shops
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};




/* =========================
   GET SINGLE SHOP
========================= */
export const getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id)
      .populate("createdBy", "name email");

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    return res.status(200).json(shop);
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};


/* =========================
   UPDATE SHOP (CREATOR ONLY)
========================= */
export const updateShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    if (shop.createdBy.toString() !== req.employeeId) {
      return res.status(403).json({
        message: "You are not allowed to update this shop"
      });
    }

    const fields = [
      "shopName",
      "shopType",
      "description",
      "ownerName",
      "ownerPhone",
      "ownerEmail",
      // "phone",
      // "alternatePhone",
      // "email",
      "address",
      "city",
      "state",
      "pincode",
      "country",
      "gstNumber",
      "openingTime",
      "closingTime",
      "isActive"
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        shop[field] = req.body[field];
      }
    });

    if (req.body.latitude && req.body.longitude) {
      shop.location = {
        latitude: Number(req.body.latitude),
        longitude: Number(req.body.longitude)
      };
    }

    await shop.save();

    return res.status(200).json({
      message: "Shop updated successfully",
      shop
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};


/* =========================
   DELETE SHOP
========================= */
export const deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    // if (shop.createdBy.toString() !== req.employeeId) {
    //   return res.status(403).json({
    //     message: "You are not allowed to delete this shop"
    //   });
    // }

    // 🔥 delete owner image
    // if (shop.ownerImage?.public_id) {
    //   await cloudinary.uploader.destroy(shop.ownerImage.public_id);
    // }

    // 🔥 delete shop images
    // for (const img of shop.shopImages) {
    //   await cloudinary.uploader.destroy(img.public_id);
    // }

    await shop.deleteOne();

    return res.status(200).json({
      message: "Shop deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

export const updateShopIsActive = async (req, res) => {
  try {
    const { id } = req.params
    // console.log(id)
    const shop = await Shop.findOne({ _id: id });
    // console.log(shop)

    if (!shop) {
      return res.status(404).json({ message: "Shop not found !" });
    }


    const isBlockedUser = await Shop.findOneAndUpdate({ _id: id }, { isActive: !shop.isActive }, { new: true })
    // console.log(isBlockedUser)
    return res.status(201).json({ message: isBlockedUser.isActive ? "Shop blocked" : "Employee unblocked", isBlockedUser })

  } catch (error) {
    return res.status(500).json({ message: "Inernal Server Error", error: error.message })
  }
}

/* =========================
   GET SHOPS BY LOGGED-IN EMPLOYEE (CREATED BY ME)
========================= */
/* =========================
   GET MY SHOPS (WITH PAGINATION)
========================= */
export const getMyShops = async (req, res) => {
  try {
    const employeeId = req.employeeId;

    const { search, city, state, shopType, isActive } = req.query;

    // ✅ Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 1000000;
    const skip = (page - 1) * limit;

    let query = {
      createdBy: employeeId
    };

    if (city) query.city = city;
    if (state) query.state = state;
    if (shopType) query.shopType = shopType;
    if (isActive !== undefined) query.isActive = isActive === "true";

    if (search) {
      query.$or = [
        { shopName: { $regex: search, $options: "i" } },
        { ownerName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    // 🔢 Total count
    const total = await Shop.countDocuments(query);

    // 📦 Paginated data
    const shops = await Shop.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      shops
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

