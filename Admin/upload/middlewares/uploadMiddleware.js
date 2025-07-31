const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const baseUploadPath = path.join(__dirname, '..'); // points to /Admin/upload
    const folder = file.mimetype === 'application/json' ? 'json' : 'images'; // subfolder
    const uploadPath = path.join(baseUploadPath, folder);

    // ✅ Ensure folder exists before saving
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const safeName = file.originalname.replace(/\s+/g, '_'); // Replace spaces
    cb(null, `${unique}-${safeName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/json'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and JSON files are allowed.'), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
