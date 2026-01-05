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
    const hashedPassword = await bcrypt.hash(password, 10);

    // Upload profile photo (optional)
    let profilePhoto = "";
    if (req.file) {
      const upload = await cloudinary.uploader.upload(req.file.path, {
        folder: "employees"
      });
      profilePhoto = upload.secure_url;
    }

    // Create employee
    const employee = await Employee.create({
      name,
      email,
      password: hashedPassword,
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
    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
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
    const employees = await Employee.find().sort({ createdAt: -1 });

    return res.status(200).json({
      total: employees.length,
      employees
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
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    return res.status(200).json(employee);
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
    const { name, phone, designation, isActive } = req.body;

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Update normal fields
    if (name) employee.name = name;
    if (phone) employee.phone = phone;
    if (designation) employee.designation = designation;
    if (typeof isActive === "boolean") employee.isActive = isActive;

    // 🔥 PROFILE PHOTO UPDATE
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

      // 3️⃣ Save new image data
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
