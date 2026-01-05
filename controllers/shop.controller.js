import Shop from "../model/shop.model.js";
import cloudinary from "../config/cloudinary.js";

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
      phone,
      alternatePhone,
      email,
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
    if (!shopName || !phone || !address || !latitude || !longitude) {
      return res.status(400).json({
        message: "shopName, phone, address, latitude and longitude are required"
      });
    }

    /* ================= OWNER IMAGE ================= */
    let ownerImage = { url: "", public_id: "" };

    if (req.files?.ownerImage?.[0]) {
      const upload = await cloudinary.uploader.upload(
        req.files.ownerImage[0].path,
        { folder: "shops/owner" }
      );

      ownerImage = {
        url: upload.secure_url,
        public_id: upload.public_id
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
        const upload = await cloudinary.uploader.upload(file.path, {
          folder: "shops/images"
        });

        shopImages.push({
          url: upload.secure_url,
          public_id: upload.public_id
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
      phone,
      alternatePhone,
      email,
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
export const getAllShops = async (req, res) => {
  try {
    const { city, state, shopType, search } = req.query;

    let query = {};

    if (city) query.city = city;
    if (state) query.state = state;
    if (shopType) query.shopType = shopType;

    if (search) {
      query.$or = [
        { shopName: { $regex: search, $options: "i" } },
        { ownerName: { $regex: search, $options: "i" } }
      ];
    }

    const shops = await Shop.find(query)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      total: shops.length,
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
      "phone",
      "alternatePhone",
      "email",
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
    if (shop.ownerImage?.public_id) {
      await cloudinary.uploader.destroy(shop.ownerImage.public_id);
    }

    // 🔥 delete shop images
    for (const img of shop.shopImages) {
      await cloudinary.uploader.destroy(img.public_id);
    }

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
