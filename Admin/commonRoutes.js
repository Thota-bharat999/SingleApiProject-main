const express = require('express');
const router = express.Router();
const Category = require('../Admin/categoryModels');
const logger=require('../utils/logger')

// GET /api/common/category
/**
 * @swagger
 * /api/common/category:
 *   get:
 *     summary: Get all product categories
 *     tags: [Public - Categories]
 *     responses:
 *       200:
 *         description: List of all categories
 *         content:
 *           application/json:
 *             example:
 *               - id: cat001
 *                 name: Electronics
 *                 description: Gadgets and devices
 *               - id: cat002
 *                 name: Clothing
 *                 description: Fashion and apparel
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: Server error
 *               error: Database connection failed
 */

router.get('/category', async (req, res) => {
  try {
    const categories = await Category.find({}, { _id: 0, id: 1, name: 1, description: 1 });
    res.json(categories);
  } catch (err) {
    logger.error('Fetch Categories Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
