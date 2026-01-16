import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = path.join(__dirname, "..", "uploads");

    if (file.fieldname === "ownerImage") {
      folder = path.join(folder, "shops", "owner");
    } else if (file.fieldname === "shopImages") {
      folder = path.join(folder, "shops", "images");
    } else if (file.fieldname === "profilePhoto") {
      if (req.originalUrl.includes("admin")) {
        folder = path.join(folder, "admin", "profiles");
      } else {
        folder = path.join(folder, "employees", "profiles");
      }
    } else if (file.fieldname === "outletImages") {
      folder = path.join(folder, "outlets");
    } else {
      folder = path.join(folder, "others");
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
