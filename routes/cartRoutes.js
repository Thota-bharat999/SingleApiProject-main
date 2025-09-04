const express = require("express");
const router = express.Router();
const { addToCart,deleteFromCart} = require("../controllers/cartController");

/**
 * @swagger
 * /api/user/cart/add:
 *   post:
 *     summary: Add a product to the user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Product added to cart successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request (invalid input or product not found)
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       500:
 *         description: Server error
 */
router.post("/add", addToCart);
/**
 * @swagger
 * /api/user/cart/delete:
 *   delete:
 *     summary: Remove a product from the user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "user456"
 *               productId:
 *                 type: string
 *                 example: "prod123"
 *     responses:
 *       200:
 *         description: Product removed from cart successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Product removed from cart successfully
 *                 cart:
 *                   type: object
 *                   description: Updated cart after deletion
 *       400:
 *         description: Bad request (missing userId or productId)
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: Cart or product not found
 *       500:
 *         description: Server error
 */
router.delete("/delete", deleteFromCart);

module.exports = router;

