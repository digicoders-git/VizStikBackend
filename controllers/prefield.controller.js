import Prefield from "../model/prefield.model.js";
import ExcelJS from "exceljs";

/* =========================
   GET ALL PREFIELDS (For General Use)
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

/* =========================
   GET ALL PREFIELDS ADMIN (With Pagination & Search)
========================= */
export const getAllPrefieldsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", Branch = "", Circle_AM = "", Section_AE = "" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // DEBUG LOGS
    console.log('=== PREFIELD REQUEST ===');
    console.log('Query params:', { Branch, Circle_AM, Section_AE, search, page, limit });

    let query = {};

    if (Branch) query.Branch = { $regex: Branch, $options: "i" };
    if (Circle_AM) query.Circle_AM = { $regex: Circle_AM, $options: "i" };
    if (Section_AE) query.Section_AE = { $regex: Section_AE, $options: "i" };

    if (search) {
      const searchRegex = new RegExp(search, "i");
      const searchConditions = [
        { Govt_District: searchRegex },
        { City: searchRegex },
        { WD_Code: searchRegex }
      ];

      if (!Branch) searchConditions.push({ Branch: searchRegex });
      if (!Circle_AM) searchConditions.push({ Circle_AM: searchRegex });
      if (!Section_AE) searchConditions.push({ Section_AE: searchRegex });

      query.$and = [
        ...(Branch ? [{ Branch: { $regex: Branch, $options: "i" } }] : []),
        ...(Circle_AM ? [{ Circle_AM: { $regex: Circle_AM, $options: "i" } }] : []),
        ...(Section_AE ? [{ Section_AE: { $regex: Section_AE, $options: "i" } }] : []),
        { $or: searchConditions }
      ];
    }

    console.log('MongoDB Query:', JSON.stringify(query, null, 2));

    const total = await Prefield.countDocuments(query);
    const data = await Prefield.find(query)
      .sort({ WD_Code: 1 })
      .skip(skip)
      .limit(Number(limit));

    console.log('Results found:', total);
    console.log('======================\n');

    res.status(200).json({
      success: true,
      message: "Prefields fetched successfully",
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      },
      data: data
    });

  } catch (error) {
    console.error("Get Prefields Admin Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/* =========================
   DOWNLOAD PREFIELDS EXCEL
========================= */
export const downloadPrefieldsExcel = async (req, res) => {
  try {
    const { Branch, Circle_AM, Section_AE } = req.query;
    let query = {};
    if (Branch) query.Branch = { $regex: Branch, $options: "i" };
    if (Circle_AM) query.Circle_AM = { $regex: Circle_AM, $options: "i" };
    if (Section_AE) query.Section_AE = { $regex: Section_AE, $options: "i" };
    const data = await Prefield.find(query).sort({ WD_Code: 1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Prefields");

    worksheet.columns = [
      { header: "Sr.", key: "sr", width: 10 },
      { header: "WD Code", key: "WD_Code", width: 20 },
      { header: "Branch", key: "Branch", width: 20 },
      { header: "Govt District", key: "Govt_District", width: 20 },
      { header: "Circle AM", key: "Circle_AM", width: 20 },
      { header: "Section AE", key: "Section_AE", width: 20 },
      { header: "City", key: "City", width: 20 },
    ];

    data.forEach((item, index) => {
      worksheet.addRow({
        sr: index + 1,
        WD_Code: item.WD_Code,
        Branch: item.Branch,
        Govt_District: item.Govt_District,
        Circle_AM: item.Circle_AM,
        Section_AE: item.Section_AE,
        City: item.City,
      });
    });

    // Styling the header
    worksheet.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "Prefields_Data.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Download Excel Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const getDataByCode = async (req, res) => {
  try {
    const { WD_Code } = req.body;

    let query = {};

    if (WD_Code) {
      query.WD_Code = WD_Code;
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
