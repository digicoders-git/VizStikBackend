import sharp from "sharp";
import fs from "fs";
import path from "path";

/**
 * Compresses an image to a specified quality and overwrites the original file.
 * @param {string} filePath - Absolute path to the file.
 * @param {number} quality - Quality percentage (1-100).
 */
export const compressImage = async (filePath, quality = 50) => {
  try {
    const ext = path.extname(filePath).toLowerCase();

    // Only compress if it's an image
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      return;
    }

    const tempPath = filePath + "-temp" + ext;

    let pipeline = sharp(filePath);

    if (ext === ".jpg" || ext === ".jpeg") {
      pipeline = pipeline.jpeg({ quality });
    } else if (ext === ".png") {
      pipeline = pipeline.png({ quality, compressionLevel: 9 });
    } else if (ext === ".webp") {
      pipeline = pipeline.webp({ quality });
    }

    await pipeline.toFile(tempPath);

    // Replace original with compressed version
    fs.unlinkSync(filePath);
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    console.error("Image compression error:", error);
  }
};
