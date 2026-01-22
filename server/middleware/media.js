import fs from "fs";
import path from "path";
import sharp from "sharp";

import { handleError } from "../utils/errorHandler.js";

const uploadsFolder = `/storage/`;
const physicalDir = path.join(process.cwd(), "public", "storage");

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function safeDelete(filePath) {
  const attempts = 5;
  const delays = [50, 120, 300, 800, 1600];
  for (let i = 0; i < attempts; i++) {
    try {
      await fs.promises.unlink(filePath);
      return true;
    } catch (err) {
      if (err.code === "ENOENT") return true; // already gone
      if (err.code === "EPERM" || err.code === "EBUSY") {
        if (i < attempts - 1) await wait(delays[i]);
        continue;
      }
      if (process.env.DEBUG_MEDIA === "true") {
        console.warn(
          "[media] delete failed",
          filePath,
          err.code || err.message
        );
      }
      return false;
    }
  }
  return false;
}

async function compressOne(file, index = 0) {
  if (!file.mimetype?.startsWith("image")) return file; // skip
  const originalPath = path.resolve(file.path);
  const parsed = path.parse(file.filename);
  const newName = `${parsed.name || "image"}-${index}.jpeg`;
  const outputPath = path.join(physicalDir, newName);
  try {
    // Read original first so sharp does NOT hold an OS handle over the file while we delete.
    const buffer = await fs.promises.readFile(originalPath);
    await sharp(buffer).rotate().jpeg({ quality: 50 }).toFile(outputPath);
    // Only now mutate filename
    file.filename = newName;
    file.path = outputPath;
    // Delete original AFTER writing new file
    await safeDelete(originalPath);
  } catch (err) {
    if (process.env.DEBUG_MEDIA === "true") {
      console.error("[media] compression error", originalPath, err.message);
    }
    // Leave original (uncompressed) file in place, keep its original filename
  }
  return file;
}

export const compressImages = async (req, res, next) => {
  try {
    if (!req.files) return next();
    const allTasks = [];
    for (const key of Object.keys(req.files)) {
      const arr = req.files[key];
      if (!Array.isArray(arr)) continue;
      arr.forEach((f, i) => {
        if (f.mimetype?.startsWith("image")) {
          allTasks.push(compressOne(f, i));
        }
      });
    }
    if (allTasks.length) await Promise.all(allTasks);

    // Build filesInfo from media (keep legacy 'video' typo)
    const media = req.files.media;

    if (media.length > 100) {
      return res.status(400).json({ message: "Too many files uploaded." });
    }

    const filesInfo = [];
    if (Array.isArray(media)) {
      media.forEach((file) => {
        if (file.mimetype?.startsWith("image")) {
          filesInfo.push({
            path: `${uploadsFolder}${file.filename}`,
            fileType: "photo",
          });
        } else if (file.mimetype?.startsWith("video")) {
          filesInfo.push({
            path: `${uploadsFolder}${file.filename}`,
            fileType: "video",
          });
        }
      });
    }
    req.filesInfo = filesInfo;
  } catch (e) {
    if (process.env.DEBUG_MEDIA === "true")
      console.error("[media] compressImages error", e.message);
  }
  next();
};

export const uploadSingleFile = async (req, res, next) => {
  try {
    const { file } = req;
    if (file) {
      if (file.mimetype?.startsWith("image")) {
        await compressOne(file, 0);
        req.fileInfo = {
          path: `${uploadsFolder}${file.filename}`,
          fileType: "photo",
        };
      } else if (file.mimetype?.startsWith("video")) {
        req.fileInfo = {
          path: `${uploadsFolder}${file.filename}`,
          fileType: "video",
        };
      }
    }
    next();
  } catch (err) {
    return handleError(err, res);
  }
};
