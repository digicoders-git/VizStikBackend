import Outlet from "../model/outlet.model.js";

/* =========================
   CREATE OUTLET
========================= */
// import Outlet from "../model/outlet.model.js";
import cloudinary from "../config/cloudinary.js";

/* =========================
   CREATE OUTLET
========================= */
export const createOutlet = async (req, res) => {
  try {
    const { activity, outletMobile, latitude, longitude } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least 1 image is required"
      });
    }

    if (req.files.length < 1 || req.files.length > 8) {
      return res.status(400).json({
        success: false,
        message: "Minimum 1 and maximum 8 images allowed"
      });
    }

    // ✅ Upload images to Cloudinary
    const outletImages = [];

    for (const file of req.files) {
      const upload = await cloudinary.uploader.upload(file.path, {
        folder: "outlets"
      });

      outletImages.push({
        url: upload.secure_url,
        public_id: upload.public_id
      });
    }

    const outlet = await Outlet.create({
      activity,
      outletMobile,
      location: {
        latitude: Number(latitude),
        longitude: Number(longitude)
      },
      outletImages,
      createdBy: req.employeeId
    });

    res.status(201).json({
      success: true,
      message: "Outlet created successfully",
      data: outlet
    });

  } catch (error) {
    console.error("Create Outlet Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================
   GET MY OUTLETS
========================= */
export const getMyOutlets = async (req, res) => {
  try {
    const outlets = await Outlet.find({ createdBy: req.employeeId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: outlets.length,
      data: outlets
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================
   GET SINGLE OUTLET
========================= */
export const getOutletById = async (req, res) => {
  try {
    const outlet = await Outlet.findById(req.params.id);

    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: "Outlet not found"
      });
    }

    res.json({
      success: true,
      data: outlet
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================
   UPDATE OUTLET
========================= */
export const updateOutlet = async (req, res) => {
  try {
    const outlet = await Outlet.findById(req.params.id);

    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: "Outlet not found"
      });
    }

    // ownership check
    if (outlet.createdBy.toString() !== req.employeeId) {
      return res.status(403).json({
        success: false,
        message: "Not allowed"
      });
    }

    const { activity, outletMobile, latitude, longitude } = req.body;

    if (activity !== undefined) outlet.activity = activity;
    if (outletMobile !== undefined) outlet.outletMobile = outletMobile;

    if (latitude && longitude) {
      outlet.location = {
        latitude: Number(latitude),
        longitude: Number(longitude)
      };
    }

    // if new images uploaded
    if (req.files && req.files.length > 0) {
      if (req.files.length < 1 || req.files.length > 8) {
        return res.status(400).json({
          success: false,
          message: "Minimum 1 and maximum 8 images allowed"
        });
      }

      outlet.outletImages = req.files.map(file => ({
        url: file.path,
        public_id: file.filename
      }));
    }

    await outlet.save();

    res.json({
      success: true,
      message: "Outlet updated",
      data: outlet
    });

  } catch (error) {
    console.error("Update Outlet Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================
   DELETE OUTLET
========================= */
export const deleteOutlet = async (req, res) => {
  try {
    const outlet = await Outlet.findById(req.params.id);

    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: "Outlet not found"
      });
    }

    if (outlet.createdBy.toString() !== req.employeeId) {
      return res.status(403).json({
        success: false,
        message: "Not allowed"
      });
    }

    await outlet.deleteOne();

    res.json({
      success: true,
      message: "Outlet deleted"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
