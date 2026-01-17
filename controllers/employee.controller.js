import Employee from "../model/employee.model.js";
import generateToken from "../config/token.js";
import ExcelJS from "exceljs";
import { sendOtpSms } from "../utils/sendSms.js";
import Shop from "../model/shop.model.js";
import Prefield from "../model/prefield.model.js";
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
   CREATE EMPLOYEE
========================= */
export const createEmployee = async (req, res) => {
  try {
    const { name, email, password, state, city, area, phone, designation } = req.body;

    // Required fields check
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be 6 letters"
      });
    }
    // ✅ Phone number validation (Indian)
    if (!isValidIndianMobile(phone)) {
      return res.status(400).json({
        message: "Invalid mobile number"
      });
    }

    // Check existing employee
    // 🔍 Check duplicate email or phone
    const existingEmployee = await Employee.findOne({
      $or: [
        { email },
        { phone }
      ]
    });

    if (existingEmployee) {
      if (existingEmployee.email === email) {
        return res.status(400).json({
          message: "Employee already exists with this email"
        });
      }

      if (existingEmployee.phone === phone) {
        return res.status(400).json({
          message: "Employee already exists with this mobile number"
        });
      }

      return res.status(400).json({
        message: "Employee already exists"
      });
    }

    // Hash password
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Upload profile photo (optional)
    let profilePhoto = { url: "", public_id: "" };

    // 🔥 Image Compression
    await compressImage(req.file.path, 50);

    const filename = req.file.filename;
    const localPath = `uploads/employees/profiles/${filename}`;

    profilePhoto = {
      url: `${req.protocol}://${req.get("host")}/${localPath}`,
      public_id: localPath
    };

    const employee = await Employee.create({
      name,
      email,
      password, // plain text
      phone,
      state,
      city,
      area,
      designation,
      profilePhoto
    });


    return res.status(201).json({
      message: "Employee created successfully",
      employee
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

/* =========================
   EMPLOYEE LOGIN
========================= */

export const employeeLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // 1️⃣ Validate input
    if (!phone || !password) {
      return res.status(400).json({
        message: "phone and password are required"
      });
    }

    // 2️⃣ Check employee exists
    const employee = await Employee.findOne({ phone });
    if (!employee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    // 3️⃣ Check active status
    if (!employee.isActive) {
      return res.status(403).json({
        message: "Your account is disabled. Contact admin."
      });
    }

    // 4️⃣ Password match
    // const isMatch = await bcrypt.compare(password, employee.password);
    // if (!isMatch) {
    //   return res.status(400).json({
    //     message: "Invalid email or password"
    //   });
    // }

    if (!(employee.password == password)) {
      return res.status(400).json({
        message: "password is wrong"
      });
    }

    // 5️⃣ Generate EMPLOYEE TOKEN
    const token = generateToken(employee._id);

    // 6️⃣ Update last login
    employee.lastLogin = new Date();
    await employee.save();

    return res.status(200).json({
      message: "Employee login successful",
      token,
      employee   // password auto hide (schema toJSON)
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};


/* =========================
   GET ALL EMPLOYEES
========================= */
/* =========================
   GET ALL EMPLOYEES (WITH SEARCH + FILTER + PAGINATION)
========================= */
export const getAllEmployees = async (req, res) => {
  try {
    const { search, isActive } = req.query;

    // ✅ Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10000000;
    const skip = (page - 1) * limit;

    let query = {};

    // 🔍 Search (name, email, phone, designation)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { designation: { $regex: search, $options: "i" } }
      ];
    }

    // 🟢 Active / Inactive Filter
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    // 🔢 Total count
    const total = await Employee.countDocuments(query);

    // 📦 Paginated + Populate
    const employees = await Employee.find(query)
      .populate("addedShops")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // ➕ Add totalShops field
    const result = employees.map(emp => ({
      ...emp.toObject(),
      totalShops: emp.addedShops.length
    }));

    return res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      employees: result
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};



/* =========================
   GET SINGLE EMPLOYEE
========================= */
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate("addedShops"); // 🔥 SHOP POPULATE

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    const totalShops = employee.addedShops.length;

    return res.status(200).json({
      ...employee.toObject(),
      totalShops
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};


/* =========================
   UPDATE EMPLOYEE
========================= */
export const updateEmployee = async (req, res) => {
  try {
    const { name, phone, designation, state, city, area, isActive, password } = req.body;

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    /* ================= NORMAL FIELDS ================= */

    if (!isValidIndianMobile(phone)) {
      return res.status(400).json({
        message: "Invalid mobile number"
      });
    }
    if (name) employee.name = name;
    if (phone) employee.phone = phone;
    if (designation) employee.designation = designation;
    if (state) employee.state = state;
    if (city) employee.city = city;
    if (area) employee.area = area;
    if (typeof isActive === "boolean") employee.isActive = isActive;

    /* ================= PASSWORD UPDATE ================= */
    // ⚠️ Plain password (no bcrypt)
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters"
        });
      }
      employee.password = password;
    }

    /* ================= PROFILE PHOTO UPDATE ================= */

    if (req.file) {
      // 🔥 Image Compression
      await compressImage(req.file.path, 50);

      const filename = req.file.filename;
      const localPath = `uploads/employees/profiles/${filename}`;

      employee.profilePhoto = {
        url: `${req.protocol}://${req.get("host")}/${localPath}`,
        public_id: localPath
      };
    }

    await employee.save();

    return res.status(200).json({
      message: "Employee updated successfully",
      employee
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};


/* =========================
   DELETE EMPLOYEE
========================= */
export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // 🔥 Delete image from Cloudinary
    // if (employee.profilePhoto?.public_id) {
    //   await cloudinary.uploader.destroy(
    //     employee.profilePhoto.public_id
    //   );
    // }

    // Delete employee from DB
    await employee.deleteOne();

    return res.status(200).json({
      message: "Employee deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};


/* =========================
   CHANGE PASSWORD (EMPLOYEE)
========================= */
export const forgetEmployeePassword = async (req, res) => {
  try {
    const employeeId = req.employeeId; // from employeeAuth middleware
    const { oldPassword, newPassword } = req.body;

    // 1️⃣ Validate input
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        message: "Old password and new password are required"
      });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({
        message: "New password must be different from old password"
      });
    }

    // 2️⃣ Find employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    if (!employee.isActive) {
      return res.status(403).json({
        message: "Account disabled. Contact admin."
      });
    }

    // 3️⃣ Match old password (PLAIN TEXT)
    if (employee.password !== oldPassword) {
      return res.status(400).json({
        message: "Old password is incorrect"
      });
    }

    // 4️⃣ Update password (PLAIN TEXT)
    employee.password = newPassword;
    await employee.save();

    return res.status(200).json({
      message: "Password changed successfully"
    });

  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};


/* ================= UPDATE EMPLOYEE ACTIVE STATUS ================= */
// export const updateEmployeeIsAcive = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { isActive } = req.body;

//     // 1️⃣ Validate ID
//     if (!id) {
//       return res.status(400).json({
//         message: "Employee ID is required"
//       });
//     }

//     // 2️⃣ Validate isActive (must be boolean)
//     if (typeof isActive !== "boolean") {
//       return res.status(400).json({
//         message: "isActive value must be true or false"
//       });
//     }

//     // 3️⃣ Update employee status
//     const employee = await Employee.findByIdAndUpdate(
//       id,
//       { isActive },
//       { new: true }
//     );

//     // 4️⃣ If employee not found
//     if (!employee) {
//       return res.status(404).json({
//         message: "Employee not found"
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: `Employee ${isActive ? "activated" : "deactivated"} successfully`,
//       employee
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message
//     });
//   }
// };

/* =========================
   GET EMPLOYEE WITH OUTLETS
========================= */
export const getEmployeeWithOutlets = async (req, res) => {
  try {
    const employee = await Employee.getWithOutlets(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    return res.status(200).json(employee);
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

export const updateEmployeeIsActive = async (req, res) => {
  try {
    const { id } = req.params
    // console.log(id)
    const user = await Employee.findOne({ _id: id });
    // console.log(user)

    if (!user) {
      return res.status(404).json({ message: "Employee not found !" });
    }


    const isBlockedUser = await Employee.findOneAndUpdate({ _id: id }, { isActive: !user.isActive }, { new: true })
    // console.log(isBlockedUser)
    return res.status(201).json({ message: isBlockedUser.isActive ? "Employee unblocked" : "Employee blocked", isBlockedUser })

  } catch (error) {
    return res.status(500).json({ message: "Inernal Server Error", error: error.message })
  }
}

export const sendLoginOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone is required" });
    }

    const employee = await Employee.findOne({ phone });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (!employee.isActive) {
      return res.status(403).json({ message: "Account disabled" });
    }

    // 🔢 Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    employee.otp = otp;
    employee.otpExpire = new Date(Date.now() + 5 * 60 * 1000); // 5 min
    await employee.save();

    // 📩 Send SMS
    const smsSent = await sendOtpSms(phone, otp);

    if (!smsSent) {
      return res.status(500).json({
        message: "Failed to send OTP SMS"
      });
    }

    return res.json({
      message: "OTP sent successfully"
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const verifyLoginOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP required" });
    }

    const employee = await Employee.findOne({ phone });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (!employee.otp || employee.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (employee.otpExpire < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // ✅ Clear OTP
    employee.otp = null;
    employee.otpExpire = null;
    employee.lastLogin = new Date();
    await employee.save();

    // 🎟 Generate token
    const token = generateToken(employee._id);

    return res.json({
      message: "Login successful",
      token,
      employee
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getStats = async (req, res) => {
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

    // 🔢 Total count (with filters)
    const total = await Shop.countDocuments(query);

    // 📅 TODAY DATE RANGE
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 🆕 Today shops count (employee wise)
    const todayCount = await Shop.countDocuments({
      createdBy: employeeId,
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    // 📦 Paginated data
    const shops = await Shop.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      page,
      total,              // total shops (filtered)
      todayCount,         // 🆕 today added shops
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
// ===================================================

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit
};

export const registerOrUpdateEmployee = async (req, res) => {
  try {
    const {
      WD_Code,
      Branch,
      Govt_District,
      Circle_AM,
      Section_AE,
      City,
      typeOfDs,
      dsName,
      dsMobile
    } = req.body;

    // 1️⃣ Check WD_Code exists
    const validWD = await Prefield.findOne({ WD_Code });
    if (!validWD) {
      return res.status(400).json({
        success: false,
        message: "WD code is wrong"
      });
    }

    // 2️⃣ Find ANY employee by WD_Code
    let employee = await Employee.findOne({ WD_Code }).sort({ createdAt: -1 });

    // 3️⃣ Generate OTP
    const otp = generateOTP();
    const otpExpire = new Date(Date.now() + 5 * 60 * 1000);

    // ===============================
    // CASE 1: WD exists → UPDATE mobile
    // ===============================
    if (employee) {
      if (!employee.isActive) {
        return res.status(403).json({
          message: "Your account is disabled. Contact admin."
        });
      }

      // 🔥 UPDATE MOBILE NUMBER
      employee.dsMobile = dsMobile;

      // ❗ Do not update main data yet
      employee.otp = otp;
      employee.otpExpire = otpExpire;
      employee.tempData = {
        Branch,
        Govt_District,
        Circle_AM,
        Section_AE,
        City,
        typeOfDs,
        dsName
      };

      await employee.save();
    }

    // ===============================
    // CASE 2: WD not found → Create new
    // ===============================
    else {
      employee = await Employee.create({
        WD_Code,
        dsMobile,
        otp,
        otpExpire,
        isVerified: false,
        isActive: true,
        tempData: {
          Branch,
          Govt_District,
          Circle_AM,
          Section_AE,
          City,
          typeOfDs,
          dsName
        }
      });
    }

    // 4️⃣ Send OTP
    const smsSent = await sendOtpSms(dsMobile, otp);
    console.log("OTP:", dsMobile, otp);

    if (!smsSent) {
      return res.status(500).json({
        success: false,
        message: "OTP Not Sent"
      });
    }

    return res.status(200).json({
      success: true,
      message: `OTP sent to ${dsMobile}`,
      employeeId: employee._id
    });

  } catch (error) {
    console.error("Register Employee Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};





export const verifyOtpAndLogin = async (req, res) => {
  try {
    const { dsMobile, otp } = req.body;

    const employee = await Employee.findOne({ dsMobile });
    console.log(employee)
    if (!employee) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (employee.otp !== otp) {
      return res.status(400).json({ success: false, message: "Wrong OTP" });
    }

    if (employee.otpExpire < new Date()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    // ✅ Now FINALIZE DATA
    if (employee.tempData) {
      Object.assign(employee, employee.tempData);
      employee.tempData = null;
    }

    employee.isVerified = true;
    employee.otp = null;
    employee.otpExpire = null;
    employee.lastLogin = new Date();

    await employee.save();

    const token = generateToken(employee._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      employee
    });

  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};



// for Admin 

// controllers/employee.controller.js

export const getAllEmployeesAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      Branch,
      Govt_District,
      City,
      typeOfDs,
      isActive,
      isVerified,
      fromDate,
      toDate,
      Circle_AM,
      Section_AE
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    let query = {};

    /* ========================
       🔎 GLOBAL SEARCH
    ======================== */
    if (search) {
      query.$or = [
        { dsName: { $regex: search, $options: "i" } },
        { dsMobile: { $regex: search, $options: "i" } },
        { WD_Code: { $regex: search, $options: "i" } },
        { Branch: { $regex: search, $options: "i" } },
        { City: { $regex: search, $options: "i" } },
        { Circle_AM: { $regex: search, $options: "i" } },
        { Section_AE: { $regex: search, $options: "i" } }
      ];
    }

    /* ========================
       🧭 FILTERS
    ======================== */
    if (Branch) query.Branch = { $regex: Branch, $options: "i" };
    if (Govt_District) query.Govt_District = Govt_District;
    if (City) query.City = City;
    if (typeOfDs) query.typeOfDs = typeOfDs;
    if (Circle_AM) query.Circle_AM = { $regex: Circle_AM, $options: "i" };
    if (Section_AE) query.Section_AE = { $regex: Section_AE, $options: "i" };

    if (isActive !== undefined) query.isActive = isActive === "true";
    if (isVerified !== undefined) query.isVerified = isVerified === "true";

    /* ========================
       📅 DATE FILTER
    ======================== */
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    /* ========================
       🔢 COUNT
    ======================== */
    const total = await Employee.countDocuments(query);

    /* ========================
       📦 FETCH DATA WITH FULL SHOP DATA
    ======================== */
    const employees = await Employee.find(query)
      .populate({
        path: "addedShops",
      })
      .populate({
        path: "addedOutlet",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      message: "Employees with shops fetched successfully",
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      },
      data: employees
    });

  } catch (error) {
    console.error("Get employees error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/* =========================
   DOWNLOAD EMPLOYEES EXCEL
========================= */
export const downloadEmployeesExcel = async (req, res) => {
  try {
    const { role, Branch, Circle_AM, Section_AE } = req.query;
    let query = {};
    if (Branch) {
      query.Branch = { $regex: Branch, $options: "i" };
    }
    if (Circle_AM) {
      query.Circle_AM = { $regex: Circle_AM, $options: "i" };
    }
    if (Section_AE) {
      query.Section_AE = { $regex: Section_AE, $options: "i" };
    }

    const employees = await Employee.find(query).sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Employees");

    worksheet.columns = [
      { header: "Sr.", key: "sr", width: 10 },
      { header: "Employee Name", key: "dsName", width: 25 },
      { header: "WD Code", key: "WD_Code", width: 15 },
      { header: "Mobile", key: "dsMobile", width: 15 },
      { header: "Branch", key: "Branch", width: 20 },
      { header: "City", key: "City", width: 20 },
      { header: "Type", key: "typeOfDs", width: 15 },
      { header: "Active", key: "isActive", width: 10 },
      { header: "Total Outlets", key: "totalOutlets", width: 15 },
      { header: "Created At", key: "createdAt", width: 20 },
    ];

    employees.forEach((emp, index) => {
      worksheet.addRow({
        sr: index + 1,
        dsName: emp.dsName,
        WD_Code: emp.WD_Code,
        dsMobile: emp.dsMobile,
        Branch: emp.Branch,
        City: emp.City,
        typeOfDs: emp.typeOfDs,
        isActive: emp.isActive ? "Yes" : "No",
        totalOutlets: emp.addedOutlet?.length || 0,
        createdAt: new Date(emp.createdAt).toLocaleString("en-IN"),
      });
    });

    worksheet.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "Employees_Data.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Download Employees Excel error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
