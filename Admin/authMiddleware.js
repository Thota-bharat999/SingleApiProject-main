const jwt = require('jsonwebtoken');
const Admin = require('../Admin/authModel');
const adminLogger=require('../utils/adminLogger')
const Messages = require("../utils/messages");

const verifyAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    adminLogger.warn("Unauthorized access attempt: No token provided");
    return res.status(401).json({ message: Messages.ADMIN.ERROR.UNAUTHORIZED });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "Zp7#Gw!84Ld@RmXqY2$vTf*Akn13UBoEr%Cs9WNh");
    const admin = await Admin.findById(decoded.id);

    if (!admin || admin.role !== "admin") {
      adminLogger.warn(`Access denied: User with ID ${decoded.id} is not an admin`);
      return res.status(403).json({ message:Messages.ADMIN.ERROR.FORBIDDEN });
    }
    adminLogger.info(`Admin verified: ${admin.email} (ID: ${admin._id})`);
    req.admin = admin;
    next();
  } catch (err) {
    adminLogger.error(`JWT verification failed: ${err.message}`);
    return res.status(401).json({ message:Messages.ADMIN.ERROR.AUTH_ERROR });
  }
};

module.exports = verifyAdmin;
