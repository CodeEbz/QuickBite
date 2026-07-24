const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const config = require('../config');

const rootUploadDir = path.resolve(process.cwd(), config.uploadDir);
fs.mkdirSync(rootUploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, rootUploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '.jpg') || '.jpg';
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }
});

function configureCloudinary() {
  if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) return false;
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret
  });
  return true;
}

async function storeImage(file, folder, req) {
  if (!file) return null;
  if (configureCloudinary()) {
    const result = await cloudinary.uploader.upload(file.path, { folder: `quickbite/${folder}` });
    fs.promises.unlink(file.path).catch(() => {});
    return result.secure_url;
  }
  const publicRoot = config.publicBaseUrl || `${req.protocol}://${req.get('host')}`;
  return `${publicRoot}/uploads/${file.filename}`;
}

module.exports = { upload, storeImage };
