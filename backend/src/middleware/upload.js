const fs = require('fs');
const path = require('path');
const multer = require('multer');

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    const error = new Error('Only image files are allowed');
    error.statusCode = 400;
    cb(error);
  }
};

const createUploader = (subfolder) => {
  const uploadDir = path.join(__dirname, '..', '..', 'uploads', subfolder);
  fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  });

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  });
};

const uploadProfilePicture = createUploader('profile-pictures');
const uploadPostImage = createUploader('post-images');

module.exports = { uploadProfilePicture, uploadPostImage };
