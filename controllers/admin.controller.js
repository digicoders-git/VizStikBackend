import generateToken from "../config/token.js"
import Admin from "../model/admin.models.js"
import bcrypt from 'bcryptjs'
import { compressImage } from "../utils/imageResizer.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";


export const create = async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All Fields must me required" })
    }
    const existAdmin = await Admin.findOne({ email })
    if (existAdmin) {
      return res.status(400).json({ message: "User already Exist !" })
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    let profilePhoto = { url: "", public_id: "" };
    if (req.file) {
      // 🔥 Image Compression
      await compressImage(req.file.path, 50);

      // const filename = req.file.filename;
      // const localPath = `uploads/admin/profiles/${filename}`;

      // profilePhotoUrl = `${req.protocol}://${req.get("host")}/${localPath}`;

      // 🔥 Cloudinary Upload
      const result = await uploadOnCloudinary(req.file.path, "admin/profiles");
      if (result) {
        profilePhoto = {
          url: result.url,
          public_id: result.public_id
        };
      }
    }

    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      profilePhoto: profilePhoto
    })
    return res.status(201).json({ message: "Admin created", admin })
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error !", error: error.message })
  }
}


export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: "Please Enter email or password !" })
    }
    const existAdmin = await Admin.findOne({ email })
    if (!existAdmin) {
      return res.status(400).json({ message: "Admin not Found !" })
    }
    const passMatch = await bcrypt.compare(password, existAdmin.password)
    if (!passMatch) {
      return res.status(400).json({ message: "incorrect password !" })
    }
    let token;
    try {
      token = generateToken(existAdmin._id)
    } catch (error) {
      return res.status(500).json({ message: "Token not found !" })
    }
    return res.status(200).json({
      email: existAdmin.email,
      password: existAdmin.password,
      profilePhoto: existAdmin.profilePhoto?.url || "",
      token
    })
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error !", error: error.message })
  }
}

export const get = async (req, res) => {
  try {
    const data = await Admin.find()
    return res.status(200).json({ message: "Admin Found", data })
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error !", error: error.message })
  }
}

export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedAdmin = await Admin.findByIdAndDelete(id);

    if (!deletedAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // 🔥 Delete old from Cloudinary if possible
    if (deletedAdmin.profilePhoto?.public_id) {
      await deleteFromCloudinary(deletedAdmin.profilePhoto.public_id);
    }

    return res.status(200).json({ message: "Admin deleted successfully", deletedAdmin });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}

export const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Update fields if provided
    if (name) admin.name = name;
    if (email) admin.email = email;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      admin.password = hashedPassword;
    }

    // Update profile photo if provided
    if (req.file) {
      // 🔥 Image Compression
      await compressImage(req.file.path, 50);

      // const filename = req.file.filename;
      // const localPath = `uploads/admin/profiles/${filename}`;

      // admin.profilePhoto = `${req.protocol}://${req.get("host")}/${localPath}`;

      // 🔥 Cloudinary Upload
      const result = await uploadOnCloudinary(req.file.path, "admin/profiles");
      if (result) {
        admin.profilePhoto = {
          url: result.url,
          public_id: result.public_id
        };
      }
    }

    await admin.save();

    return res.status(200).json({ message: "Admin updated successfully", admin });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}
