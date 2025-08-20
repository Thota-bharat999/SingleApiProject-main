console.log("✅ Swagger is reading userRoutes.js");
const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  forgotPassword,
  // verifyOtp,
  getProducts,
  resetPassword,
  getAllUsers,
  getUserById,
  getProfile,
  getCartByUserId,
} = require("../controllers/userController");

const {
  verifyToken,
  verifyLoginToken,
} = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post("/register", registerUser);

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Login user and retrieve JWT token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post("/login", loginUser);

/**
 * @swagger
 * /api/user/forgot-password:
 *   post:
 *     summary: Request password reset link
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Password reset link sent successfully
 *       400:
 *         description: Invalid email or user not found
 *       500:
 *         description: Server error
 */
router.post("/forgot-password", forgotPassword);
// /**
//  * @swagger
//  * /api/user/verify-otp:
//  *   post:
//  *     summary: Verify the OTP for password reset or account verification
//  *     tags:
//  *       - "Users"
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               otp:
//  *                 type: string
//  *                 example: "756110"
//  *               email:
//  *                 type: string
//  *                 example: "user@example.com"
//  *     responses:
//  *       200:
//  *         description: OTP verified successfully
//  *       400:
//  *         description: Invalid OTP or expired
//  */
// router.post('/verify-otp', verifyOtp);

/**
 * @swagger
 * /api/user/reset-password:
 *   post:
 *     summary: Reset user password using OTP
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               OTP:
 *                 type: string
 *                 example: your-reset-token-here
 *               newPassword:
 *                 type: string
 *                 example: newpassword123
 *               confirmPassword:
 *                 type: string
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
router.post("/reset-password", resetPassword);

/**
 * @swagger
 * /api/user/cart/{userId}:
 *   get:
 *     summary: Get the cart details for a specific user
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user whose cart is being retrieved
 *     responses:
 *       200:
 *         description: Successfully retrieved user's cart
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: Cart not found
 *       500:
 *         description: Server error
 */
router.get("/cart/:userId", verifyToken, getCartByUserId);

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get the profile of the currently logged-in user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       500:
 *         description: Server error
 */
router.get("/profile", verifyToken, getProfile);

/**
 * @swagger
 * /api/user/user/{id}:
 *   get:
 *     summary: Get user details by user ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to retrieve
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/user/:id", verifyToken, getUserById);

/**
 * @swagger
 * /api/user/product:
 *   get:
 *     summary: Get a list of products with pagination, search, and filters
 *     description: >
 *       Fetch products for the perfume website with support for search, category filter, brand filter, 
 *       price range, and pagination.  
 *       Use query parameters to customize results.  
 *       Example: `/api/user/product?search=dior&category=Perfume&page=1&limit=10`
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product name or brand (case-insensitive).
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter products by category (e.g., Perfume, Body Spray).
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filter products by brand (e.g., Dior, Chanel).
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter.
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination (default = 1).
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of products per page (default = 10).
 *     responses:
 *       200:
 *         description: Successfully retrieved product list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 100
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64a4f02ebd38b90017c1f23a"
 *                       name:
 *                         type: string
 *                         example: "Dior Sauvage Eau de Parfum"
 *                       brand:
 *                         type: string
 *                         example: "Dior"
 *                       category:
 *                         type: string
 *                         example: "Perfume"
 *                       price:
 *                         type: number
 *                         example: 199.99
 *                       description:
 *                         type: string
 *                         example: "Fresh and powerful fragrance for men."
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Server error
 */
router.get("/product", getProducts);

module.exports = router;
