import Branch from "../model/branchSubadmin.model.js";

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
