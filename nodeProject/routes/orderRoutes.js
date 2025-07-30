const express = require('express');
const router = express.Router();
const userLogger = require('../utils/userLogger');
const { placeOrder, getUserOrders } = require('../controllers/placeOrderController');
const { verifyToken } = require('../middleware/authMiddleware');

// ✅ ONLY ONE route declaration for /order

/**
 * @swagger
 * /api/user/order:
 *   post:
 *     summary: Place an order for the authenticated user
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *               totalPrice:
 *                 type: number
 *     responses:
 *       201:
 *         description: Order placed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 orderId:
 *                   type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       500:
 *         description: Server error
 */
router.post('/order', verifyToken, (req, res, next) => {
  userLogger.info("🧭 Inside POST /order route");
  next();
}, placeOrder);
/**
 * @swagger
 * /api/user/orders:
 *   get:
 *     summary: Retrieve all orders placed by the authenticated user
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of user orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   orderId:
 *                     type: string
 *                   items:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         productId:
 *                           type: string
 *                         quantity:
 *                           type: integer
 *                   totalPrice:
 *                     type: number
 *                   status:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       500:
 *         description: Server error
 */
router.get("/orders", verifyToken, getUserOrders);

module.exports = router;
