import Login from "../model/login.model.js";

/* =========================
   CREATE LOGIN USER
========================= */
export const createLoginUser = async (req, res) => {
  try {
    const { name, password, role } = req.body;

    if (!name || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, password and role are required"
      });
    }

    // Check already exists
    const exist = await Login.findOne({ name });

    if (exist) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this name"
      });
    }

    const user = await Login.create({
      name,
      password,   // 👈 plain text save
      role
    });

    res.status(201).json({
      success: true,
      message: "Login user created successfully",
      data: user
    });

  } catch (error) {
    console.error("Create Login User Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};
