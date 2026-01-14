import Prefield from "../model/prefield.model.js";

/* =========================
   GET ALL PREFIELDS
========================= */
export const getAllPrefields = async (req, res) => {
  try {
    const data = await Prefield.find();

    res.status(200).json({
      success: true,
      count: data.length,
      data: data
    });

  } catch (error) {
    console.error("Get Prefields Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

export const getDataByCode = async (req, res) => {
  try {
    const { WD_Code } = req.body;   // 👈 body se le rahe

    let query = {};

    if (WD_Code) {
      query.WD_Code = WD_Code;   // 👈 filter lag gaya
    }

    const data = await Prefield.find(query);

    res.status(200).json({
      success: true,
      count: data.length,
      data: data
    });

  } catch (error) {
    console.error("Get Data By Code Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};
