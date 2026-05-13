const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Only use Cloudinary if properly configured
const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY !== 'your_api_key' &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_API_SECRET !== 'your_api_secret';

// Local disk storage (used when Cloudinary not configured)
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const localDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed'), false);
};

let cloudinary = null;
let auctionStorage = localDiskStorage;
let profileStorage = localDiskStorage;

if (isCloudinaryConfigured) {
  try {
    cloudinary = require('cloudinary').v2;
    const { CloudinaryStorage } = require('multer-storage-cloudinary');

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    auctionStorage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'auction-platform/auctions',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }],
      },
    });

    profileStorage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'auction-platform/profiles',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }],
      },
    });

    console.log('✅ Cloudinary configured');
  } catch (err) {
    console.warn('⚠️ Cloudinary setup failed, using local storage:', err.message);
    auctionStorage = localDiskStorage;
    profileStorage = localDiskStorage;
  }
} else {
  console.log('ℹ️ Cloudinary not configured - using local storage for uploads');
}

const uploadAuctionImages = multer({
  storage: auctionStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 8 },
});

const uploadProfileImage = multer({
  storage: profileStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

module.exports = { cloudinary, uploadAuctionImages, uploadProfileImage };