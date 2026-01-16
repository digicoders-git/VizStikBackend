import Outlet from "../model/outlet.model.js";
import Employee from "../model/employee.model.js";
import ExcelJS from "exceljs";
import { compressImage } from "../utils/imageResizer.js";

/* =========================
   CREATE OUTLET
========================= */
export const createOutlet = async (req, res) => {
  try {
    const { activity, outletMobile, outletName, latitude, longitude } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least 1 image is required"
      });
    }

    if (req.files.length < 1 || req.files.length > 15) {
      return res.status(400).json({
        success: false,
        message: "Minimum 1 and maximum 15 images allowed"
      });
    }

    const outletImages = [];

    for (const file of req.files) {
      // 🔥 Image Compression
      await compressImage(file.path, 50);

      const filename = file.filename;
      const localPath = `uploads/outlets/${filename}`;

      outletImages.push({
        url: `${req.protocol}://${req.get("host")}/${localPath}`,
        public_id: localPath
      });
    }

    const outlet = await Outlet.create({
      activity,
      outletMobile,
      outletName,
      location: {
        latitude: Number(latitude),
        longitude: Number(longitude)
      },
      outletImages,
      createdBy: req.employeeId
    });

    // 🔥 EMPLOYEE ME OUTLET ID ADD KARO
    await Employee.findByIdAndUpdate(req.employeeId, {
      $push: { addedOutlet: outlet._id }
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
      if (req.files.length < 1 || req.files.length > 15) {
        return res.status(400).json({
          success: false,
          message: "Minimum 1 and maximum 8 images allowed"
        });
      }

      const images = [];
      for (const file of req.files) {
        // 🔥 Image Compression
        await compressImage(file.path, 50);

        const filename = file.filename;
        const localPath = `uploads/outlets/${filename}`;

        images.push({
          url: `${req.protocol}://${req.get("host")}/${localPath}`,
          public_id: localPath
        });
      }
      outlet.outletImages = images;
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

/* =========================
   DELETE OUTLET (ADMIN)
========================= */
export const deleteOutletAdmin = async (req, res) => {
  try {
    const outlet = await Outlet.findById(req.params.id);

    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: "Outlet not found"
      });
    }

    await outlet.deleteOne();

    res.json({
      success: true,
      message: "Outlet deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================
   OUTLET DASHBOARD STATS
========================= */
export const getOutletDashboardStats = async (req, res) => {
  try {
    const employeeId = req.employeeId; // auth middleware se aa raha hai

    // 1️⃣ Total outlets
    const totalOutlets = await Outlet.countDocuments({ createdBy: employeeId });

    // 2️⃣ Today's date range
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 3️⃣ Today added outlets count
    const todayOutlets = await Outlet.countDocuments({
      createdBy: employeeId,
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    // 4️⃣ Last 5 recent outlets
    const recentOutlets = await Outlet.find({ createdBy: employeeId })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalOutlets,
        todayOutlets,
        recentOutlets
      }
    });

  } catch (error) {
    console.error("Outlet Dashboard Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


/*
=====================================
 GET ALL OUTLETS (ADMIN)
=====================================
 Query Params Supported:

 ?page=1
 ?limit=10
 ?search=mobileOrActivity
 ?employeeId=xxxx
 ?fromDate=2026-01-01
 ?toDate=2026-01-31

*/

export const getAllOutletsAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100000000,
      search,
      employeeId,
      Branch,
      Circle_AM,
      Section_AE,
      fromDate,
      toDate
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    let query = {};

    /* ========================
       🔎 SEARCH
    ======================== */
    if (search) {
      query.$or = [
        { activity: { $regex: search, $options: "i" } },
        { outletMobile: { $regex: search, $options: "i" } }
      ];
    }

    /* ========================
       👤 FILTER BY EMPLOYEE
    ======================== */
    if (employeeId) {
      query.createdBy = employeeId;
    }

    /* ========================
       🏢 FILTER BY BRANCH (Via Employee)
    ======================== */
    if (Branch) {
      const employeesInBranch = await Employee.find({ Branch: { $regex: Branch, $options: "i" } }).select("_id");
      const employeeIds = employeesInBranch.map(emp => emp._id);
      query.createdBy = { $in: employeeIds };
    }

    if (Circle_AM) {
      const employeesInCircle = await Employee.find({ Circle_AM: { $regex: Circle_AM, $options: "i" } }).select("_id");
      const employeeIds = employeesInCircle.map(emp => emp._id);
      query.createdBy = { $in: employeeIds };
    }

    if (Section_AE) {
      const employeesInSection = await Employee.find({ Section_AE: { $regex: Section_AE, $options: "i" } }).select("_id");
      const employeeIds = employeesInSection.map(emp => emp._id);
      query.createdBy = { $in: employeeIds };
    }

    /* ========================
       📅 FILTER BY DATE
    ======================== */
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    /* ========================
       🔢 TOTAL COUNT
    ======================== */
    const total = await Outlet.countDocuments(query);

    /* ========================
       📦 FETCH DATA
    ======================== */
    const outlets = await Outlet.find(query)
      .populate("createdBy", "dsName dsMobile WD_Code typeOfDs")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      message: "All outlets fetched successfully",
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      },
      data: outlets
    });

  } catch (error) {
    console.error("Get outlets error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/* =========================
   DOWNLOAD OUTLETS EXCEL
========================= */
export const downloadOutletsExcel = async (req, res) => {
  try {
    const { employeeId, Branch, Circle_AM, Section_AE } = req.query;
    let query = {};
    if (employeeId) {
      query.createdBy = employeeId;
    }

    if (Branch) {
      const employeesInBranch = await Employee.find({ Branch: { $regex: Branch, $options: "i" } }).select("_id");
      const employeeIds = employeesInBranch.map(emp => emp._id);
      query.createdBy = { $in: employeeIds };
    }

    if (Circle_AM) {
      const employeesInCircle = await Employee.find({ Circle_AM: { $regex: Circle_AM, $options: "i" } }).select("_id");
      const employeeIds = employeesInCircle.map(emp => emp._id);
      query.createdBy = { $in: employeeIds };
    }

    if (Section_AE) {
      const employeesInSection = await Employee.find({ Section_AE: { $regex: Section_AE, $options: "i" } }).select("_id");
      const employeeIds = employeesInSection.map(emp => emp._id);
      query.createdBy = { $in: employeeIds };
    }

    const outlets = await Outlet.find(query)
      .populate("createdBy", "dsName WD_Code")
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Outlets");

    worksheet.columns = [
      { header: "Sr.", key: "sr", width: 10 },
      { header: "Activity", key: "activity", width: 25 },
      { header: "Outlet Mobile", key: "outletMobile", width: 20 },
      { header: "Employee Name", key: "employeeName", width: 25 },
      { header: "WD Code", key: "wdCode", width: 15 },
      { header: "Latitude", key: "latitude", width: 15 },
      { header: "Longitude", key: "longitude", width: 15 },
      { header: "Created At", key: "createdAt", width: 20 },
      { header: "Image URL", key: "imageUrl", width: 50 },
    ];

    outlets.forEach((outlet, index) => {
      const imageUrl = outlet.outletImages?.[0]?.url || "";
      const rowData = {
        sr: index + 1,
        activity: outlet.activity,
        outletMobile: outlet.outletMobile,
        employeeName: outlet.createdBy?.dsName || "N/A",
        wdCode: outlet.createdBy?.WD_Code || "N/A",
        latitude: outlet.location?.latitude,
        longitude: outlet.location?.longitude,
        createdAt: new Date(outlet.createdAt).toLocaleString("en-IN"),
        imageUrl: imageUrl || "No Image",
      };

      const row = worksheet.addRow(rowData);

      // Make Image URL clickable
      if (imageUrl) {
        row.getCell("imageUrl").value = {
          text: imageUrl,
          hyperlink: imageUrl,
          tooltip: "Click to view image"
        };
        row.getCell("imageUrl").font = { color: { argb: "FF0000FF" }, underline: true };
      }
    });

    // Styling the header
    worksheet.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "Outlets_Data.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Download Outlets Excel Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

