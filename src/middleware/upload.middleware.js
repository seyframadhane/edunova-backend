// src/middleware/upload.middleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
const PDF_DIR   = path.join(process.cwd(), "uploads", "pdfs");
const VIDEO_DIR = path.join(process.cwd(), "uploads", "videos");
ensureDir(PDF_DIR);
ensureDir(VIDEO_DIR);

const randomName = (file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
};

/* PDF */
const pdfStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PDF_DIR),
  filename:    (_req, file, cb)  => cb(null, randomName(file)),
});
const pdfFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const ok = file.mimetype === "application/pdf" && ext === ".pdf";
  return ok ? cb(null, true) : cb(new Error("Only PDF files are allowed"), false);
};
exports.uploadCoursePdf = multer({
  storage: pdfStorage,
  fileFilter: pdfFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
}).single("pdf");

/* Video */
const videoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, VIDEO_DIR),
  filename:    (_req, file, cb)  => cb(null, randomName(file)),
});
const ALLOWED_VIDEO_MIME = new Set(["video/mp4","video/webm","video/ogg","video/quicktime"]);
const ALLOWED_VIDEO_EXT  = new Set([".mp4",".webm",".ogg",".mov"]);
const videoFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_VIDEO_MIME.has(file.mimetype) && ALLOWED_VIDEO_EXT.has(ext)) return cb(null, true);
  cb(new Error("Only mp4 / webm / ogg / mov videos are allowed"), false);
};
exports.uploadCourseVideo = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: { fileSize: 500 * 1024 * 1024 },
}).single("video");

/* Avatar */
const AVATAR_DIR = path.join(process.cwd(), "uploads", "avatars");
ensureDir(AVATAR_DIR);

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename:    (_req, file, cb)  => cb(null, randomName(file)),
});
const ALLOWED_AVATAR_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_AVATAR_EXT  = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const avatarFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_AVATAR_MIME.has(file.mimetype) && ALLOWED_AVATAR_EXT.has(ext)) return cb(null, true);
  cb(new Error("Only jpg / png / webp / gif images are allowed"), false);
};
exports.uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single("avatar");

/* Cover image */
const COVER_DIR = path.join(process.cwd(), "uploads", "covers");
ensureDir(COVER_DIR);

const coverStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, COVER_DIR),
  filename:    (_req, file, cb)  => cb(null, randomName(file)),
});
exports.uploadCover = multer({
  storage: coverStorage,
  fileFilter: avatarFilter, // reuse same image filter
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
}).single("cover");