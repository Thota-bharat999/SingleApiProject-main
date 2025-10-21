const Admin=require('./authModel');

const jwt=require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Messages = require("../utils/messages");
const User=require('../models/userModel');
const adminLogger = require('../utils/adminLogger');
const sendEmail = require('../utils/sendEmail'); 

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    adminLogger.debug(`Entered The password:${password}`);

    if (!email || !password) {
      adminLogger.warn("Email or password not provided")
      return res.status(400).json({ message:Messages.ADMIN.ERROR.EMAIL_PASSWORD_REQUIRED });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

    if (!admin) {
      adminLogger.warn(`Admin is not found with eamil:${email}`)
      return res.status(401).json({ message:Messages.ADMIN.ERROR.INVALID_EMAIL_PASSWORD });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    adminLogger.debug(`Password Match Status:${isMatch} `)
    adminLogger.debug(`🧾 Stored hashed password: ${admin.password}`);

    if (!isMatch) {
      adminLogger.warn(`Incorrect password attempt for admin:${email}`)
      return res.status(401).json({ message:Messages.ADMIN.ERROR.EMAIL_PASSWORD_REQUIRED });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || "Kj3!f9sD28@#sL0pWm$7vZrN^x2eA1qT!bY&Cu9X", {
      expiresIn: '1d'
    });
    adminLogger.info(`Admin Login Successful:${email}`)

    res.status(200).json({
      message: Messages.ADMIN.SUCCESS.LOGIN,
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    adminLogger.error(`Login error:${error.message}`)
    res.status(500).json({ message:Messages.COMMON.ERROR.SERVER_ERROR, error: error.message });
  }
};

// Admin Forgot_password
exports.adminForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    adminLogger.info(`[ADMIN] Forgot password request received. Email: ${email}`);

    // ✅ Validate email input
    if (!email) {
      adminLogger.warn(`[ADMIN] Email not provided in forgot password request`);
      return res.status(400).json({ message: Messages.ADMIN.ERROR.EMAIL_REQUIRED });
    }

    // ✅ Check admin existence
    const admin = await Admin.findOne({ email });
    if (!admin) {
      adminLogger.warn(`[ADMIN] Admin not found: ${email}`);
      return res.status(404).json({ message: Messages.ADMIN.ERROR.ADMIN_NOT_FOUND });
    }

    // ✅ Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // ✅ Save OTP and expiry
    admin.resetOTP = otp;
    admin.resetOTPExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    await admin.save();

    adminLogger.debug(`[ADMIN] Generated OTP for ${email}: ${otp}`);

    // ✅ Send OTP email using your HTML template
    const startTime = Date.now();

    await sendEmail({
      toEmail: admin.email,
      subject: "Moon Shade Admin Password Reset OTP",
      otp, // will automatically replace {{OTP_CODE}} and {{EMAIL}} in otp-template.html
      userRole: "Admin", // Specify user role
    });

    const duration = Date.now() - startTime;
    adminLogger.info(`[ADMIN] OTP email sent to ${email} in ${duration} ms`);

    // ✅ Response
    return res.status(200).json({
      message: Messages.ADMIN.SUCCESS.OTP_SENT,
    });
  } catch (error) {
    adminLogger.error(`[ADMIN] Forgot Password OTP Error: ${error.message}`);
    return res.status(500).json({
      message: Messages.COMMON.ERROR.SERVER_ERROR,
      error: error.message,
    });
  }
};


// Admin Reset-Password
exports.adminResetPassword = async (req, res) => {
  try {
    const { otp, newPassword, confirmPassword } = req.body;

    if (!otp || !newPassword || !confirmPassword) {
      adminLogger.warn("Missing fields in admin reset password request");
      return res.status(400).json({ message: Messages.ADMIN.ERROR.MISSING_FIELDS });
    }

    if (newPassword !== confirmPassword) {
      adminLogger.warn(`Passwords do not match`);
      return res.status(400).json({ message: Messages.ADMIN.ERROR.INVALID_PASSWORD });
    }

    const admin = await Admin.findOne({ resetOTP: otp });
    if (!admin) {
      adminLogger.warn(`Admin not found for OTP: ${otp}`);
      return res.status(404).json({ message:Messages.ADMIN.ERROR.OTP_INVALID });
    }

    // Use email only after you have the admin
    adminLogger.info(`Admin password reset request for email: ${admin.email}`);

    if (!admin.resetOTPExpiry || admin.resetOTPExpiry < Date.now()) {
      adminLogger.warn(`Invalid or expired OTP for admin email: ${admin.email}`);
      return res.status(400).json({ message:Messages.ADMIN.ERROR.OTP_EXPIRED });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    admin.resetOTP = undefined;
    admin.resetOTPExpiry = undefined;
    await admin.save();

    adminLogger.info(`Password reset successful for admin email: ${admin.email}`);
    res.status(200).json({ message:Messages.ADMIN.SUCCESS.PASSWORD_RESET });

  } catch (err) {
    adminLogger.error(`Error resetting password for admin: ${err.message}`);
    res.status(500).json({ message:Messages.COMMON.ERROR.SERVER_ERROR, error: err.message });
  }
};

// Admin - View Registered Users
exports.getAllUsers=async(req,res)=>{
  try{
    adminLogger.info("Admin requested to fetch all users")
    const users=await User.find({},'_id name email');
     adminLogger.info(`✅ Fetched ${users.length} users from database`);
    res.status(200).json(users.map(user=>({
      id: user._id,
      name: user.name,
      email: user.email
    })))

  }catch(err){
     adminLogger.error(`❌ Error fetching users: ${err.message}`);
     res.status(500).json({message:Messages.COMMON.ERROR.SERVER_ERROR, error: err.message })
  }
};