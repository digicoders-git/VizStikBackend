import Branch from "../model/branchSubadmin.model.js";
import Prefield from "../model/prefield.model.js";
import Employee from "../model/employee.model.js";
import Login from "../model/login.model.js";

/* =========================
   CREATE BRANCH
========================= */
export const createBranch = async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({
        success: false,
        message: "Name and password are required"
      });
    }

    // Check if branch already exists
    const exist = await Branch.findOne({ name });

    if (exist) {
      return res.status(400).json({
        success: false,
        message: "Branch already exists"
      });
    }

    const branch = await Branch.create({
      name,
      password
    });

    res.status(201).json({
      success: true,
      message: "Branch created successfully",
      data: branch
    });

  } catch (error) {
    console.error("Create Branch Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

/* =========================
   GET BRANCH STATS
========================= */
export const getBranchStats = async (req, res) => {
  try {
    // 1. Get unique branches from Prefields
    // Using aggregation to ensure we get distinct values
    const branches = await Prefield.distinct("Branch");

    const stats = [];

    // Filter out empty/null branches
    const validBranches = branches.filter(b => b && b.trim() !== "");

    for (const branchName of validBranches) {
      // 2. Count Employees for this branch
      const empCount = await Employee.countDocuments({
        Branch: { $regex: branchName, $options: "i" }
      });

      // 3. Get unique Circle_AMs
      const circleAMs = await Prefield.distinct("Circle_AM", {
        Branch: branchName
      });
      const validCircleAMs = circleAMs.filter(c => c && c.trim() !== "");

      // 4. Get unique Section_AEs
      const sectionAEs = await Prefield.distinct("Section_AE", {
        Branch: branchName
      });
      const validSectionAEs = sectionAEs.filter(s => s && s.trim() !== "");

      stats.push({
        branch: branchName,
        employeeCount: empCount,
        circleAMCount: validCircleAMs.length,
        sectionAECount: validSectionAEs.length
      });
    }

    // Sort by branch name
    stats.sort((a, b) => a.branch.localeCompare(b.branch));

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error("Get Branch Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

/* =========================
   GET BRANCH USERS (Circle_AM / Section_AE)
========================= */
export const getBranchRoleUsers = async (req, res) => {
  try {
    const { branch, role } = req.query; // role needs to be 'Circle_AM' or 'Section_AE'

    if (!branch || !role) {
      return res.status(400).json({
        success: false,
        message: "Branch and role are required"
      });
    }

    // 1. Get distinct codes from Prefields for this branch
    // The field in Prefield is named exactly as the role (Circle_AM, Section_AE)
    const codes = await Prefield.distinct(role, { Branch: branch });
    const validCodes = codes.filter(c => c && c.trim() !== "");

    // 2. Find Login users for these codes
    // We assume the username in Login matches the code in Prefields
    const users = await Login.find({
      name: { $in: validCodes }
    }).select("-__v");
    // We include password because user requested it ("password dikhega")
    // Usually we exclude it, but here it's a specific requirement for Admin.

    res.status(200).json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error("Get Branch Users Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};
