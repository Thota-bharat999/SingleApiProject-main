const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const { uploadImage } = require('../controllers/uploadImageController');
const { uploadJson } = require('../controllers/uploadJsonController');

// POST /api/admin/upload/image
/**
 * @swagger
 * /api/admin/upload/image:
 *   post:
 *     summary: Upload an image file
 *     tags: [Admin - Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The image file to upload
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: No file uploaded or invalid format
 *       500:
 *         description: Internal server error
 */
router.post('/image', upload.single('file'), uploadImage);


// POST /api/admin/upload/json
/**
 * @swagger
 * /api/admin/upload/json:
 *   post:
 *     summary: Upload a JSON file
 *     tags: [Admin - Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The JSON file to upload
 *     responses:
 *       200:
 *         description: JSON file uploaded successfully
 *       400:
 *         description: No file uploaded or invalid format
 *       500:
 *         description: Internal server error
 */
router.post('/json', upload.single('file'), uploadJson);


module.exports = router;
