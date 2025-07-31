// controllers/userController.js
const User = require('../models/userModel');
const userLogger=require('../utils/userLogger')
const Messages = require("../utils/messages");
const crypto=require('crypto')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require("../utils/sendEmail");
const mongoose = require("mongoose");
const Cart = require("../models/cartModel");

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      userLogger.warn(`Registration failed: Email already exists (${email})`);
      return res.status(400).json({ message: Messages.USER.SUCCESS.USER_EXIST});
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });

    userLogger.info(`New user registered: ${user.email} (ID: ${user._id})`);

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({
      messag: Messages.USER.SUCCESS.REGISTER,
      userId: user._id,
      token,
    });
  } catch (err) {
    userLogger.error(`Registration error: ${err.message}`);
    res.status(500).json({ message:Messages.COMMON.ERROR.SERVER_ERROR});
  }
};

exports.getAllUsers = async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
};

exports.getUserById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: Messages.COMMON.INVALID_REQUEST });
  }

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message:Messages.USER.ERROR.USER_NOT_FOUND});

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: Messages.COMMON.SERVER_ERROR, error: err.message });
  }
};
//LoginUser
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      userLogger.warn("Login failed: Missing email or password");
      return res.status(400).json({ message: Messages.USER.ERROR. EMAIL_PASSWORD_REQUIRED });
    }

    const user = await User.findOne({ email });
    if (!user) {
       userLogger.warn(`Login failed: No user found with email ${email}`);
      return res.status(401).json({ message: Messages.USER.ERROR.EMAIL_PASSWORD_REQUIRED });
    }

    // If passwords are hashed, use bcrypt:
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      userLogger.warn(`Login failed: Incorrect password for email ${email}`);
      return res.status(401).json({ message: Messages.USER.ERROR.EMAIL_PASSWORD_REQUIRED });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET ||"Kj3!f9sD28@#sL0pWm$7vZrN^x2eA1qT!bY&Cu9X",
      { expiresIn: "24h" }
    );
    userLogger.info(`Login successful for user ${email}`);

    return res.status(200).json({
      message: Messages.USER.SUCCESS.LOGIN,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    userLogger.error(`Login error for email ${req.body.email}: ${err.message}`);
    res.status(500).json({ message: Messages.COMMON.ERROR.SERVER_ERROR, error: err.message });
  }
};


//forgotPassword Functionality
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      userLogger.warn("Forgot password attempt failed: Email not provided");
      return res.status(400).json({ message:Messages.USER.ERROR.EMAIL_REQUIRED });
    }

    const user = await User.findOne({ email });
    if (!user) {
      userLogger.warn(`Forgot password attempt: No user found with email ${email}`);
      return res.status(404).json({ message:Messages.USER.ERROR.USER_NOT_FOUND});
    }

    // ✅ Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // ✅ Hash OTP for storage
    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    // ✅ Save hashed OTP and expiry
    user.resetPasswordToken = hashedOTP;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // ✅ Send email
    const startTime = Date.now();

    await sendEmail({
      toEmail: user.email,
      subject: "Your OTP Code",
      html: `<p>Hello User,</p>
      <p>Your OTP is: <b>${otp}</b></p>
       <p>This OTP is valid for 15 minutes.</p>
       <p>If you did not request this, please ignore.</p>`,
    });
    userLogger.info("Sending to:", user.email, "OTP:", otp);

    const duration = Date.now() - startTime;
    userLogger.info(`📤 OTP email sent to ${email} in ${duration} ms`);

    return res.status(200).json({ message:Messages.USER.SUCCESS.OTP_SENT});

  } catch (err) {
    userLogger.error(`Forgot password error for ${req.body.email}: ${err.message}`);
    return res.status(500).json({ message: Messages.COMMON.ERROR.SERVER_ERROR, error: err.message });
  }
};




// Reset-Password Functionality
exports.resetPassword = async (req, res) => {
  try {
    const { OTP, newPassword, confirmPassword } = req.body;
    userLogger.debug('Reset password body:', req.body);

    if (!OTP || !newPassword || !confirmPassword) {
       userLogger.warn(`[USER] Reset password attempt failed - Missing fields: otp=${OTP}, newPassword=${newPassword}, confirmPassword=${confirmPassword}`);
      return res.status(400).json({ message: Messages.USER.ERROR.MISSING_FIELDS });
    }

    if (newPassword !== confirmPassword) {
      userLogger.warn("Reset password failed: Passwords do not match");
      return res.status(400).json({ message: Messages.USER.ERROR.INVALID_PASSWORD });
    }

    // Hash the OTP to match what was stored
    const hashedOTP = crypto.createHash("sha256").update(OTP).digest("hex");

    // Find user by matching hashed OTP
    const user = await User.findOne({
      resetPasswordToken: hashedOTP,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
       userLogger.warn("Reset password failed: Invalid or expired OTP");
      return res.status(400).json({ message: Messages.USER.ERROR.OTP_EXPIRED });
    }

    // Update password and clear OTP fields
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
     userLogger.info(`Password reset successful for user ${user.email}`);
    return res.status(200).json({ message:Messages.USER.SUCCESS.PASSWORD_RESET });
  } catch (err) {
    userLogger.error(`Reset password error: ${err.message}`);
    return res.status(500).json({ message: Messages.COMMON.ERROR.SERVER_ERROR, error: err.message });
  }
};

// View Profile Functionality
exports.getProfile = async (req, res) => {
  try {
    // From middleware
    const { id } = req.user;

    const user = await User.findById(id).select("-password -resetToken -resetTokenExpires");
    if (!user) {
       userLogger.warn(`Get profile failed: User not found for ID ${id}`);
      return res.status(404).json({ message: Messages.USER.ERROR.USER_NOT_FOUND });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email
    });
  } catch (error) {
  userLogger.error(`Error retrieving profile for user ID ${req.user?.id || "unknown"}: ${error.message}`);
    res.status(500).json({ message: Messages.COMMON.ERROR.SERVER_ERROR, error: error.message });
  }
};
// View Carts
 exports.getCartByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      userLogger.warn("🛒 Get Cart: Missing userId in request");
      return res.status(400).json({ message:Messages.USER.ERROR.VIEW_USERS_REQUIRED });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart || cart.products.length === 0) {
      userLogger.info(`🛒 Get Cart: No items found for userId ${userId}`);
      return res.status(404).json({ message:Messages.USER.ERROR.CART_USER_REQUIED });
    }

    let cartTotal = 0;

    const enrichedCart = cart.products.map((product) => {
      const price = Number(product.price) || 0;
      const quantity = Number(product.quantity) || 0;
      const totalPrice = price * quantity;

      cartTotal += totalPrice;

      return {
        productId: product.productId,
        name: product.name, // corrected field
        price,
        quantity,
        totalPrice: Number(totalPrice.toFixed(2))
      };
    });

    userLogger.info(`🛒 Get Cart: Cart fetched successfully for userId ${userId}`);

    res.status(200).json({
      userId: cart.userId,
      cart: enrichedCart,
      cartTotal: Number(cartTotal.toFixed(2)),
      currency: cart.currency || "INR"
    });

  } catch (err) {
    userLogger.error(`❌ Get Cart Error for userId ${req.params.userId || "unknown"}: ${err.message}`);
    res.status(500).json({ message:Messages.COMMON.ERROR.SERVER_ERROR, error: err.message });
  }
};




