const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/userModel");
const userLogger=require('../utils/userLogger')
const Messages = require("../utils/messages");

// Token for normal auth (used in profile route)
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    userLogger.warn("Token missing in request headers");
    return res.status(401).json({ message: "Token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email };
    userLogger.info(`✅ Token verified for user ID: ${decoded.id}`);
    // req.user = decoded;
    next();
  } catch (err) {
    userLogger.error("JWT verification error:", err.message);
    userLogger.debug("Secret Used:", process.env.JWT_SECRET);
    res.status(401).json({ message:Messages.USER.ERROR.AUTH_ERROR });
  }
};

// Token for login-based hashed token check
const verifyLoginToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    userLogger.warn("Login token missing in header");
    return res.status(401).json({ message: Messages.USER.ERROR.TOKEN_MISSING });
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    loginToken: hashedToken,
    loginTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    userLogger.warn("Invalid or expired login token");
    return res.status(401).json({ message:Messages.USER.ERROR.INVALID_EXPIRED_TOKEN });
  }
  userLogger.info(`✅ Login token verified for user: ${user.email}`);
  req.user = user;
  next();
};

// Export both
module.exports = {
  verifyToken,
  verifyLoginToken,
};
