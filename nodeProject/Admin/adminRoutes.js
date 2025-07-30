// adminRoutes.js
const express = require('express');
const router = express.Router(); // ✅ express.Router, not 'router' package
// correct usage
const {
  loginAdmin,
  adminForgotPassword,
  adminResetPassword,
  getAllUsers
} = require('./authControllers');



const verifyAdmin = require('./authMiddleware');
const {addCategory, updateCategory,deleteCategory,getAllCategoris}  = require('./categoryControllers');
const {addProduct,updateProduct,deleteProduct,getProducts}=require('./productControllers')
const{getPaginatedOrders}=require('./orderControllers')
/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
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
 *         description: Admin logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', loginAdmin);
/**
 * @swagger
 * /api/admin/forgot-password:
 *   post:
 *     summary: Send OTP to admin email for password reset
 *     tags:
 *       - Admin Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *     responses:
 *       200:
 *         description: OTP sent to admin email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP sent to admin email
 *       400:
 *         description: Email is missing or invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email is required
 *       404:
 *         description: Admin not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Admin not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 *                 error:
 *                   type: string
 *                   example: Error details
 */
router.post('/forgot-password', adminForgotPassword);
/**
 * @swagger
 * /api/admin/reset-password:
 *   post:
 *     summary: Reset admin password using OTP
 *     tags:
 *       - Admin Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NewSecure@123
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 example: NewSecure@123
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset successful
 *       400:
 *         description: Invalid input (e.g., mismatched passwords or invalid OTP)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Passwords do not match or invalid OTP
 *       404:
 *         description: Admin not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Admin not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */

router.post('/reset-password', adminResetPassword);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get('/users', verifyAdmin, getAllUsers);
/**
 * @swagger
 * /api/admin/category:
 *   post:
 *     summary: Add a new category
 *     tags:
 *       - Admin - Category
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - name
 *             properties:
 *               id:
 *                 type: string
 *                 example: cat123
 *               name:
 *                 type: string
 *                 example: Home Appliances
 *               description:
 *                 type: string
 *                 example: Devices used in the home for cooking, cleaning, etc.
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Category added
 *                 category:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 64f8f9341b11ac4f08b3dbcd
 *                     id:
 *                       type: string
 *                       example: cat123
 *                     name:
 *                       type: string
 *                       example: Home Appliances
 *                     description:
 *                       type: string
 *                       example: Devices used in the home for cooking, cleaning, etc.
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input data (missing fields)
 *       401:
 *         description: Unauthorized - Admin token missing or invalid
 *       500:
 *         description: Internal server error
 */

router.post('/category', verifyAdmin, addCategory);
/**
 * @swagger
 * /api/admin/category/{id}:
 *   put:
 *     summary: Update an existing category
 *     tags:
 *       - Admin - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The custom ID of the category to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Electronics
 *               description:
 *                 type: string
 *                 example: Updated category description
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Category updated successfully
 *                 category:
 *                   type: object
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.put('/category/:id', verifyAdmin, updateCategory);
/**
 * @swagger
 * /api/admin/category/{id}:
 *   delete:
 *     summary: Delete a category by ID
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the category to delete
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Category deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               message: "Unauthorized: No token provided"
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             example:
 *               message: "Forbidden: Not an admin"
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             example:
 *               message: Category not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: Server error
 */
router.delete('/category/:id', verifyAdmin, deleteCategory);
/**
 * @swagger
 * /api/admin/category:
 *   get:
 *     summary: Get all categories
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all categories
 *         content:
 *           application/json:
 *             example:
 *               - categoryId: cat_123abc
 *                 name: Electronics
 *                 description: All electronic gadgets
 *               - categoryId: cat_456def
 *                 name: Clothing
 *                 description: Men and women apparel
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               message: "Unauthorized: No token provided"
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             example:
 *               message: "Forbidden: Not an admin"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: Server error
 */
router.get('/category', verifyAdmin, getAllCategoris)
/**
 * @swagger
 * /api/admin/product:
 *   post:
 *     summary: Add a new product
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - stock
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: number
 *               categoryId:
 *                 type: string
 *           example:
 *             name: iPhone 14
 *             description: Latest Apple smartphone
 *             price: 999.99
 *             stock: 50
 *             categoryId: cat_abc123
 *     responses:
 *       201:
 *         description: Product added successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Product added successfully
 *               productId: prod_1234abcd
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             example:
 *               message: All required fields must be filled
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               message: "Unauthorized: No token provided"
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             example:
 *               message: "Forbidden: Not an admin"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: Server error
 */
router.post('/product', verifyAdmin,addProduct)
/**
 * @swagger
 * /api/admin/product/{id}:
 *   put:
 *     summary: Update a product by ID
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The productId of the product to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: number
 *               categoryId:
 *                 type: string
 *           example:
 *             name: Updated iPhone 14
 *             description: Updated description
 *             price: 1099.99
 *             stock: 30
 *             categoryId: cat_xyz789
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Product updated successfully
 *               product:
 *                 productId: prod_1234abcd
 *                 name: Updated iPhone 14
 *                 price: 1099.99
 *                 stock: 30
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             example:
 *               message: Product not found
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               message: "Unauthorized: No token provided"
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             example:
 *               message: "Forbidden: Not an admin"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: Server error
 */
router.put('/product/:id', verifyAdmin,updateProduct);
/**
 * @swagger
 * /api/admin/product/{id}:
 *   delete:
 *     summary: Delete a product by ID
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The productId of the product to delete
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Product deleted successfully
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             example:
 *               message: Product not found
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               message: "Unauthorized: No token provided"
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             example:
 *               message: "Forbidden: Not an admin"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: Server error
 */
router.delete('/product/:id', verifyAdmin,deleteProduct);
/**
 * @swagger
 * /api/admin/product:
 *   get:
 *     summary: Get paginated list of products
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of products per page
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             example:
 *               page: 1
 *               limit: 10
 *               total: 50
 *               totalPages: 5
 *               products:
 *                 - productId: prod_123abc
 *                   name: iPhone 14
 *                   description: Apple smartphone
 *                   price: 999
 *                   stock: 25
 *                   categoryId: cat_01
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               message: "Unauthorized: No token provided"
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             example:
 *               message: "Forbidden: Not an admin"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: Server error
 */
router.get('/product', verifyAdmin,getProducts);
/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Get paginated list of all orders
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of orders per page
 *     responses:
 *       200:
 *         description: A list of paginated orders
 *         content:
 *           application/json:
 *             example:
 *               page: 1
 *               totalPages: 5
 *               totalOrders: 50
 *               orders:
 *                 - orderId: ORD123
 *                   status: "Pending"
 *                   userId: "user123"
 *                   email: "user@example.com"
 *                   products:
 *                     - productId: "prod_abc"
 *                       name: "Product 1"
 *                       price: 99.99
 *                   total: 199.98
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *         content:
 *           application/json:
 *             example:
 *               message: "Unauthorized: No token provided"
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             example:
 *               message: "Forbidden: Not an admin"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: Server error
 */

router.get('/orders', verifyAdmin,getPaginatedOrders);

module.exports = router;
