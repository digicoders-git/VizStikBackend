import Employee from "../model/employee.model.js";
import bcrypt from "bcryptjs";
import generateToken from "../config/token.js";
import cloudinary from "../config/cloudinary.js";

/* =========================
   CREATE EMPLOYEE
========================= */
export const createEmployee = async (req, res) => {
  try {
    const { name, email, password, phone, designation } = req.body;

    // Required fields check
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    // Check existing employee
    const existEmployee = await Employee.findOne({ email });
    if (existEmployee) {
      return res.status(400).json({
        message: "Employee already exists with this email"
      });
    }

    // Hash password
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Upload profile photo (optional)
    let profilePhoto = { url: "", public_id: "" };

    if (req.file) {
      const upload = await cloudinary.uploader.upload(req.file.path, {
        folder: "employees"
      });

      profilePhoto = {
        url: upload.secure_url,
        public_id: upload.public_id
      };
    }

    const employee = await Employee.create({
      name,
      email,
      password, // plain text
      phone,
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
    const { email, password } = req.body;

    // 1️⃣ Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    // 2️⃣ Check employee exists
    const employee = await Employee.findOne({ email });
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
        message: "Invalid email or password"
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
export const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate("addedShops")
      .sort({ createdAt: -1 });

    const result = employees.map(emp => ({
      ...emp.toObject(),
      totalShops: emp.addedShops.length
    }));

    return res.status(200).json({
      total: result.length,
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
    const { name, phone, designation, isActive, password } = req.body;

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    /* ================= NORMAL FIELDS ================= */

    if (name) employee.name = name;
    if (phone) employee.phone = phone;
    if (designation) employee.designation = designation;
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
      // 1️⃣ Delete old image from Cloudinary
      if (employee.profilePhoto?.public_id) {
        await cloudinary.uploader.destroy(
          employee.profilePhoto.public_id
        );
      }

      // 2️⃣ Upload new image
      const upload = await cloudinary.uploader.upload(req.file.path, {
        folder: "employees"
      });

      // 3️⃣ Save new image
      employee.profilePhoto = {
        url: upload.secure_url,
        public_id: upload.public_id
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
    if (employee.profilePhoto?.public_id) {
      await cloudinary.uploader.destroy(
        employee.profilePhoto.public_id
      );
    }

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
   GET EMPLOYEE WITH SHOPS
========================= */
export const getEmployeeWithShops = async (req, res) => {
  try {
    const employee = await Employee.getWithShops(req.params.id);
    
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
    const user = await Employee.findOne({ _id:id });
    // console.log(user)

    if (!user) {
      return res.status(404).json({ message: "Employee not found !" });
    }


    const isBlockedUser = await Employee.findOneAndUpdate({ _id:id }, { isActive:!user.isActive },{new:true})
    // console.log(isBlockedUser)
    return res.status(201).json({ message: isBlockedUser.isActive?"Employee blocked":"Employee unblocked", isBlockedUser })

  } catch (error) {
    return res.status(500).json({ message: "Inernal Server Error", error: error.message })
  }
}