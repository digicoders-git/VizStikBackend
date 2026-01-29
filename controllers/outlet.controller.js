import Outlet from "../model/outlet.model.js";
import Employee from "../model/employee.model.js";
import Prefield from "../model/prefield.model.js";
import ExcelJS from "exceljs";
import { compressImage } from "../utils/imageResizer.js";
// import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import fs from "fs";
import path from "path";
import { addOutletStamp } from "../utils/addOutletStamp.js";

import archiver from "archiver";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


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
    const employee = req.employee; // middleware se aa raha hai

    // ✅ ONLY ONE LOOP — create stamped image and save ONLY that
    for (const file of req.files) {
      const inputPath = file.path;

      // 🔥 Optional: compress original before stamping
      await compressImage(inputPath, 50);

      const stampedPath = file.path.replace(/(\.\w+)$/, "-stamped.jpg");

      await addOutletStamp({
        inputPath,
        outputPath: stampedPath,
        branchName: employee.Branch || "N/A",
        wdCode: employee.WD_Code || "N/A",
        activity: activity || "N/A",
        latitude,
        longitude,
        salesmanName: employee.dsName || "N/A",
        sectionName: employee.Section_AE || "N/A"
      });

      // 🧹 Delete original image (important)
      fs.unlinkSync(inputPath);

      const filename = path.basename(stampedPath);
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

    return res.status(201).json({
      success: true,
      message: "Outlet created successfully",
      data: outlet
    });

  } catch (error) {
    console.error("Create Outlet Error:", error);
    return res.status(500).json({
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

        // 🔥 Cloudinary Upload
        // const result = await uploadOnCloudinary(file.path, "outlets");
        // if (result) {
        //   images.push({
        //     url: result.url,
        //     public_id: result.public_id
        //   });
        // }
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

    // 🔥 Delete images from Cloudinary
    // if (outlet.outletImages && outlet.outletImages.length > 0) {
    //   for (const img of outlet.outletImages) {
    //     if (img.public_id) {
    //       await deleteFromCloudinary(img.public_id);
    //     }
    //   }
    // }

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

    // 🔥 Delete images from Cloudinary
    // if (outlet.outletImages && outlet.outletImages.length > 0) {
    //   for (const img of outlet.outletImages) {
    //     if (img.public_id) {
    //       await deleteFromCloudinary(img.public_id);
    //     }
    //   }
    // }

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
      limit = 10,
      search,
      employeeId,
      Branch,
      Govt_District,
      Circle_AM,
      Section_AE,
      activity,
      typeOfDs,
      fromDate,
      toDate
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    let query = {};

    // 1. Mandatory filters (Activity, Date Range)
    if (activity) query.activity = activity;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (toDate) {
        let end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // 2. Employee criteria (Branch, Govt_District, Circle_AM, Section_AE, typeOfDs, employeeId)
    let employeeFilter = {};
    if (Branch) employeeFilter.Branch = { $regex: Branch, $options: "i" };
    if (Govt_District) employeeFilter.Govt_District = { $regex: Govt_District, $options: "i" };
    if (Circle_AM) employeeFilter.Circle_AM = { $regex: Circle_AM, $options: "i" };
    if (Section_AE) employeeFilter.Section_AE = { $regex: Section_AE, $options: "i" };
    if (typeOfDs) employeeFilter.typeOfDs = typeOfDs;
    if (employeeId) employeeFilter._id = employeeId;

    if (Object.keys(employeeFilter).length > 0) {
      const filteredEmployees = await Employee.find(employeeFilter).select("_id");
      const filteredEmployeeIds = filteredEmployees.map(e => e._id);
      query.createdBy = { $in: filteredEmployeeIds };
    }

    // 3. Global Search (outletMobile, outletName, activity, dsName, dsMobile, WD_Code)
    if (search) {
      const searchRegex = new RegExp(search, "i");

      const matchedEmployees = await Employee.find({
        $or: [
          { dsName: searchRegex },
          { dsMobile: searchRegex },
          { WD_Code: searchRegex }
        ]
      }).select("_id");
      const matchedEmployeeIds = matchedEmployees.map(e => e._id);

      const searchPart = {
        $or: [
          { activity: searchRegex },
          { outletMobile: searchRegex },
          { outletName: searchRegex },
          { createdBy: { $in: matchedEmployeeIds } }
        ]
      };

      if (Object.keys(query).length > 0) {
        query = { $and: [query, searchPart] };
      } else {
        query = searchPart;
      }
    }

    const total = await Outlet.countDocuments(query);

    const outlets = await Outlet.find(query)
      .populate("createdBy", "dsName dsMobile WD_Code typeOfDs Branch Govt_District Circle_AM Section_AE City")
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
    const {
      employeeId,
      Branch,
      Govt_District,
      Circle_AM,
      Section_AE,
      activity,
      typeOfDs,
      search,
      fromDate,
      toDate
    } = req.query;

    let query = {};

    // Use same filtering logic as getAllOutletsAdmin
    if (activity) query.activity = activity;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        let end = new Date(toDate);
        if (toDate.length <= 10) end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    let employeeFilter = {};
    if (Branch) employeeFilter.Branch = { $regex: Branch, $options: "i" };
    if (Govt_District) employeeFilter.Govt_District = { $regex: Govt_District, $options: "i" };
    if (Circle_AM) employeeFilter.Circle_AM = { $regex: Circle_AM, $options: "i" };
    if (Section_AE) employeeFilter.Section_AE = { $regex: Section_AE, $options: "i" };
    if (typeOfDs) employeeFilter.typeOfDs = typeOfDs;
    if (employeeId) employeeFilter._id = employeeId;

    if (Object.keys(employeeFilter).length > 0) {
      const filteredEmployees = await Employee.find(employeeFilter).select("_id");
      query.createdBy = { $in: filteredEmployees.map(e => e._id) };
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      const matchedEmployees = await Employee.find({
        $or: [
          { dsName: searchRegex },
          { dsMobile: searchRegex },
          { WD_Code: searchRegex }
        ]
      }).select("_id");
      const matchedEmployeeIds = matchedEmployees.map(e => e._id);

      const searchPart = {
        $or: [
          { activity: searchRegex },
          { outletMobile: searchRegex },
          { outletName: searchRegex },
          { createdBy: { $in: matchedEmployeeIds } }
        ]
      };

      if (Object.keys(query).length > 0) {
        query = { $and: [query, searchPart] };
      } else {
        query = searchPart;
      }
    }

    const outlets = await Outlet.find(query)
      .populate("createdBy")
      .sort({ createdAt: -1 })
      .lean();

    /* ===============================
       🔥 FIND MAX IMAGES COUNT
    =============================== */
    let maxImages = 0;
    outlets.forEach(o => {
      if (o.outletImages && o.outletImages.length > maxImages) {
        maxImages = o.outletImages.length;
      }
    });

    /* ===============================
       📊 CREATE EXCEL
    =============================== */
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Outlets");

    worksheet.columns = [
      { header: "Sr.", key: "sr", width: 8 },
      { header: "Activity", key: "activity", width: 25 },
      { header: "Outlet Mobile", key: "outletMobile", width: 18 },
      { header: "Outlet Name", key: "outletName", width: 18 },

      { header: "Employee Name", key: "employeeName", width: 25 },
      { header: "Employee Mobile", key: "employeeMobile", width: 20 },
      { header: "WD Code", key: "wdCode", width: 15 },
      { header: "Branch", key: "branch", width: 20 },
      { header: "Govt District", key: "govtDistrict", width: 20 },
      { header: "Circle AM", key: "circleAM", width: 20 },
      { header: "Section AE", key: "sectionAE", width: 20 },
      { header: "City", key: "city", width: 20 },
      { header: "DS Type", key: "dsType", width: 15 },

      { header: "Latitude", key: "latitude", width: 15 },
      { header: "Longitude", key: "longitude", width: 15 },
      { header: "Created At", key: "createdAt", width: 22 },

      // 🔥 Dynamic Image Columns
      ...Array.from({ length: maxImages }).map((_, i) => ({
        header: `Image ${i + 1}`,
        key: `image${i + 1}`,
        width: 40
      }))
    ];

    /* ===============================
       🧾 FILL ROWS
    =============================== */
    outlets.forEach((outlet, index) => {
      const emp = outlet.createdBy || {};

      const rowData = {
        sr: index + 1,
        activity: outlet.activity || "",
        outletMobile: outlet.outletMobile || "",
        outletName: outlet.outletName || "",

        employeeName: emp.dsName || "N/A",
        employeeMobile: emp.dsMobile || "N/A",
        wdCode: emp.WD_Code || "N/A",
        branch: emp.Branch || "N/A",
        govtDistrict: emp.Govt_District || "N/A",
        circleAM: emp.Circle_AM || "N/A",
        sectionAE: emp.Section_AE || "N/A",
        city: emp.City || "N/A",
        dsType: emp.typeOfDs || "N/A",

        latitude: outlet.location?.latitude || "",
        longitude: outlet.location?.longitude || "",
        createdAt: new Date(outlet.createdAt).toLocaleString("en-IN")
      };

      // 🔥 Add images
      (outlet.outletImages || []).forEach((img, i) => {
        rowData[`image${i + 1}`] = img.url;
      });

      const row = worksheet.addRow(rowData);

      // 🔥 Make clickable
      (outlet.outletImages || []).forEach((img, i) => {
        const cell = row.getCell(`image${i + 1}`);
        cell.value = {
          text: img.url,
          hyperlink: img.url,
          tooltip: "Click to view image"
        };
        cell.font = {
          color: { argb: "FF0000FF" },
          underline: true
        };
      });
    });

    worksheet.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Outlets_Report.xlsx"
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


export const downloadOutletsImagesZip = async (req, res) => {
  try {
    const {
      employeeId,
      Branch,
      Govt_District,
      Circle_AM,
      Section_AE,
      activity,
      typeOfDs,
      search,
      fromDate,
      toDate
    } = req.query;

    let query = {};

    // 1. Mandatory filters (Activity, Date Range) - Synced with getAllOutletsAdmin
    if (activity) query.activity = activity;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (toDate) {
        let end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // 2. Employee criteria
    let employeeFilter = {};
    if (Branch) employeeFilter.Branch = { $regex: Branch, $options: "i" };
    if (Govt_District) employeeFilter.Govt_District = { $regex: Govt_District, $options: "i" };
    if (Circle_AM) employeeFilter.Circle_AM = { $regex: Circle_AM, $options: "i" };
    if (Section_AE) employeeFilter.Section_AE = { $regex: Section_AE, $options: "i" };
    if (typeOfDs) employeeFilter.typeOfDs = typeOfDs;
    if (employeeId) employeeFilter._id = employeeId;

    if (Object.keys(employeeFilter).length > 0) {
      const filteredEmployees = await Employee.find(employeeFilter).select("_id");
      query.createdBy = { $in: filteredEmployees.map(e => e._id) };
    }

    // 3. Global Search
    if (search) {
      const searchRegex = new RegExp(search, "i");
      const matchedEmployees = await Employee.find({
        $or: [
          { dsName: searchRegex },
          { dsMobile: searchRegex },
          { WD_Code: searchRegex }
        ]
      }).select("_id");
      const matchedEmployeeIds = matchedEmployees.map(e => e._id);

      const searchPart = {
        $or: [
          { activity: searchRegex },
          { outletMobile: searchRegex },
          { outletName: searchRegex },
          { createdBy: { $in: matchedEmployeeIds } }
        ]
      };

      if (Object.keys(query).length > 0) {
        query = { $and: [query, searchPart] };
      } else {
        query = searchPart;
      }
    }

    /* ==============================================
       📦 OPTIMIZED PROCESSING (Cursor + Stream)
    ============================================== */
    const cursor = Outlet.find(query).lean().cursor();

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Outlets_Images_Report.zip"
    );

    // level: 1 is fastest. Images are already compressed (JPG), level 9 is a waste of CPU.
    const archive = archiver("zip", { zlib: { level: 1 } });

    archive.on("error", err => {
      console.error("Archive Error:", err);
    });

    archive.pipe(res);

    let imageCount = 0;

    for (let outlet = await cursor.next(); outlet != null; outlet = await cursor.next()) {
      if (outlet.outletImages && outlet.outletImages.length) {
        outlet.outletImages.forEach((img, idx) => {
          if (img.public_id) {
            const filePath = path.join(process.cwd(), img.public_id);
            if (fs.existsSync(filePath)) {
              // Flat naming: OutletID_ImageIndex_OriginalFileName
              const baseName = path.basename(filePath);
              const zipName = `${outlet._id}_${idx + 1}_${baseName}`;
              archive.file(filePath, { name: zipName });
              imageCount++;
            }
          }
        });
      }
    }

    if (imageCount === 0) {
      archive.append("No images found for the selected filters.", { name: "README.txt" });
    }

    await archive.finalize();

  } catch (error) {
    console.error("Download Outlets Images ZIP Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
};


/* =========================
   GET OUTLET FILTER OPTIONS
========================= */
export const getOutletFilters = async (req, res) => {
  try {
    const { Branch, Govt_District, Circle_AM, Section_AE } = req.query;

    const branches = await Prefield.distinct("Branch");
    const activities = await Outlet.distinct("activity");
    const typesOfDs = await Employee.distinct("typeOfDs");

    // Hierarchical Query Building
    const buildQuery = (filters) => {
      let q = {};
      if (filters.Branch) q.Branch = { $regex: filters.Branch, $options: "i" };
      if (filters.Govt_District) q.Govt_District = { $regex: filters.Govt_District, $options: "i" };
      if (filters.Circle_AM) q.Circle_AM = { $regex: filters.Circle_AM, $options: "i" };
      if (filters.Section_AE) q.Section_AE = { $regex: filters.Section_AE, $options: "i" };
      return q;
    };

    const govtDistricts = await Prefield.distinct("Govt_District", buildQuery({ Branch }));
    const circleAMs = await Prefield.distinct("Circle_AM", buildQuery({ Branch, Govt_District }));
    const sectionAEs = await Prefield.distinct("Section_AE", buildQuery({ Branch, Govt_District, Circle_AM }));

    res.json({
      success: true,
      branches: branches.filter(Boolean).sort(),
      govtDistricts: govtDistricts.filter(Boolean).sort(),
      circleAMs: circleAMs.filter(Boolean).sort(),
      sectionAEs: sectionAEs.filter(Boolean).sort(),
      activities: activities.filter(Boolean).sort(),
      typesOfDs: typesOfDs.filter(Boolean).sort()
    });
  } catch (error) {
    console.error("Get Filters Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================
   GET ADMIN DASHBOARD STATS
========================= */
export const getAdminDashboardStats = async (req, res) => {
  try {
    const { filter = "Day", Branch, Circle_AM, Section_AE } = req.query;
    // console.log("Dashboard Stats Request:", { filter, Branch, Circle_AM, Section_AE });

    const empQuery = {};
    if (Branch && Branch !== "undefined") empQuery.Branch = { $regex: Branch.trim(), $options: "i" };
    if (Circle_AM && Circle_AM !== "undefined") empQuery.Circle_AM = { $regex: Circle_AM.trim(), $options: "i" };
    if (Section_AE && Section_AE !== "undefined") empQuery.Section_AE = { $regex: Section_AE.trim(), $options: "i" };

    let outletQuery = {};
    let empIds = [];

    // If we have filters, we must restrict by employee IDs
    if (Object.keys(empQuery).length > 0) {
      const matchingEmployees = await Employee.find(empQuery).select("_id");
      empIds = matchingEmployees.map((e) => e._id);
      outletQuery.createdBy = { $in: empIds };
    }

    // Baseline stats
    const [totalEmployees, totalOutlets, totalPrefields] = await Promise.all([
      Employee.countDocuments(empQuery),
      Outlet.countDocuments(outletQuery),
      Prefield.countDocuments(empQuery)
    ]);

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const todayAddedOutlets = await Outlet.countDocuments({
      ...outletQuery,
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    let categories = [];
    let employeeSeries = [];
    let outletSeries = [];
    let rangeStart, rangeEnd;

    if (filter === "Day") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        categories.push(d.toLocaleDateString("en-US", { weekday: "short" }));

        const start = new Date(d);
        start.setHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);

        if (i === 6) rangeStart = start;
        if (i === 0) rangeEnd = end;

        const [eCount, oCount] = await Promise.all([
          Employee.countDocuments({ ...empQuery, createdAt: { $gte: start, $lte: end } }),
          Outlet.countDocuments({ ...outletQuery, createdAt: { $gte: start, $lte: end } }),
        ]);
        employeeSeries.push(eCount);
        outletSeries.push(oCount);
      }
    } else if (filter === "Week") {
      for (let i = 3; i >= 0; i--) {
        categories.push(`Week ${4 - i}`);
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - i * 7 - 6);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        if (i === 3) rangeStart = weekStart;
        if (i === 0) rangeEnd = weekEnd;

        const [eCount, oCount] = await Promise.all([
          Employee.countDocuments({ ...empQuery, createdAt: { $gte: weekStart, $lte: weekEnd } }),
          Outlet.countDocuments({ ...outletQuery, createdAt: { $gte: weekStart, $lte: weekEnd } }),
        ]);
        employeeSeries.push(eCount);
        outletSeries.push(oCount);
      }
    } else if (filter === "Month") {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        categories.push(monthNames[d.getMonth()]);

        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

        if (i === 11) rangeStart = start;
        if (i === 0) rangeEnd = end;

        const [eCount, oCount] = await Promise.all([
          Employee.countDocuments({ ...empQuery, createdAt: { $gte: start, $lte: end } }),
          Outlet.countDocuments({ ...outletQuery, createdAt: { $gte: start, $lte: end } }),
        ]);
        employeeSeries.push(eCount);
        outletSeries.push(oCount);
      }
    } else {
      // Year
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const currentYear = now.getFullYear();
      categories = monthNames;
      rangeStart = new Date(currentYear, 0, 1);
      rangeEnd = new Date(currentYear, 11, 31, 23, 59, 59);
      for (let i = 0; i < 12; i++) {
        const start = new Date(currentYear, i, 1);
        const end = new Date(currentYear, i + 1, 0, 23, 59, 59);
        const [eCount, oCount] = await Promise.all([
          Employee.countDocuments({ ...empQuery, createdAt: { $gte: start, $lte: end } }),
          Outlet.countDocuments({ ...outletQuery, createdAt: { $gte: start, $lte: end } }),
        ]);
        employeeSeries.push(eCount);
        outletSeries.push(oCount);
      }
    }

    const filteredEmployeesTotal = employeeSeries.reduce((a, b) => a + b, 0);
    const filteredOutletsTotal = outletSeries.reduce((a, b) => a + b, 0);

    const [activeEmployeesCount, inactiveEmployeesCount] = await Promise.all([
      Employee.countDocuments({
        ...empQuery,
        isActive: true,
        createdAt: { $gte: rangeStart, $lte: rangeEnd },
      }),
      Employee.countDocuments({
        ...empQuery,
        isActive: false,
        createdAt: { $gte: rangeStart, $lte: rangeEnd },
      })
    ]);

    // console.log("Stats calculated:", { totalEmployees, totalOutlets, totalPrefields });

    res.json({
      success: true,
      stats: {
        totalEmployees,
        totalOutlets,
        totalPrefields,
        todayAddedOutlets,
        activeEmployees: activeEmployeesCount,
        inactiveEmployees: inactiveEmployeesCount,
      },
      chartData: {
        categories,
        series: {
          employees: employeeSeries,
          outlets: outletSeries,
        },
        filteredCounts: {
          employees: filteredEmployeesTotal,
          outlets: filteredOutletsTotal,
        },
        employeeStatus: {
          active: activeEmployeesCount,
          inactive: inactiveEmployeesCount,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};