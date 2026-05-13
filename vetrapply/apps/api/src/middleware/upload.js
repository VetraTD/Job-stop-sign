import multer from "multer";
import { ApiError } from "../lib/errors.js";
import { SUPPORTED_MIMES } from "../services/cvParser.js";

const MAX_SIZE = 5 * 1024 * 1024;

export const cvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!SUPPORTED_MIMES.includes(file.mimetype)) {
      return cb(new ApiError(400, "VALIDATION", `Unsupported file type: ${file.mimetype}. Only PDF or DOCX.`));
    }
    cb(null, true);
  },
});

export function handleMulterError(err, _req, _res, next) {
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return next(new ApiError(413, "VALIDATION", "File too large. Max 5MB."));
  }
  return next(err);
}
