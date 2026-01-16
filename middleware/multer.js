import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = "uploads/";

    if (file.fieldname === "ownerImage") {
      folder += "shops/owner";
    } else if (file.fieldname === "shopImages") {
      folder += "shops/images";
    } else if (file.fieldname === "profilePhoto") {
      if (req.originalUrl.includes("admin")) {
        folder += "admin/profiles";
      } else {
        folder += "employees/profiles";
      }
    } else if (file.fieldname === "outletImages") {
      folder += "outlets";
    } else {
      folder += "others";
    }

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

export default upload;
