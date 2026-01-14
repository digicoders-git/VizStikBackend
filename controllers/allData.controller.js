import Prefield from "../model/prefield.model.js";

/* =========================
   GET ALL DATA BY NAME + ROLE
========================= */
export const getAllData = async (req, res) => {
  try {
    const { name, role } = req.body;

    if (!name || !role) {
      return res.status(400).json({
        success: false,
        message: "name and role are required"
      });
    }

    let filter = {};

    if (role === "Branch") {
      filter = { Branch: name };
    } else if (role === "Circle_AM") {
      filter = { Circle_AM: name };
    } else if (role === "Section_AE") {
      filter = { Section_AE: name };
    } else if (role === "admin") {
      filter = {}; // admin = all data
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid role"
      });
    }

    const data = await Prefield.find(filter);

    res.status(200).json({
      success: true,
      total: data.length,
      data
    });

  } catch (error) {
    console.error("Get Prefield Data Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};
