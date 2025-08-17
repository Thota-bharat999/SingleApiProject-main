console.log("✅ Swagger is reading userRoutes.js");
const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  forgotPassword,
  // verifyOtp,
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

module.exports = router;
