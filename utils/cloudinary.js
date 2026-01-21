import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
  api_key: process.env.CLOUDINARY_API_KEY.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET.trim()
});

/**
 * Upload a file to cloudinary
 * @param {string} localFilePath Path to the local file
 * @param {string} folder Cloudinary folder name
 * @returns {Promise<{url: string, public_id: string}>}
 */
export const uploadOnCloudinary = async (localFilePath, folder) => {
  try {
    if (!localFilePath) return null;

    // upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: folder
    });

    // file has been uploaded successfully
    // console.log("file is uploaded on cloudinary", response.url);

    // remove the locally saved temporary file
    fs.unlinkSync(localFilePath);

    return {
      url: response.secure_url,
      public_id: response.public_id
    };
  } catch (error) {
    // remove the locally saved temporary file as the upload operation failed
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    console.error("Cloudinary upload error:", error);
    return null;
  }
};

/**
 * Delete a file from cloudinary
 * @param {string} publicId Cloudinary public_id
 * @returns {Promise<any>}
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;
    const response = await cloudinary.uploader.destroy(publicId);
    return response;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return null;
  }
};

export default cloudinary;
