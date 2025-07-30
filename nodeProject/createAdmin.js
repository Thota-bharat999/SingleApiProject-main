const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./Admin/authModel"); // Adjust path
const logger=require('./utils/logger');
const adminLogger = require("./utils/adminLogger");

mongoose.connect("mongodb://localhost:27017/jwtauthdb")
  .then(async () => {
    const existing = await Admin.findOne({ email: "jeuwaummukuza-1818@yopmail.com" });
    if (existing) {
      logger.warn("⚠️ Admin already exists. Skipping creation.");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("admin@123", 10);
    const admin = new Admin({
      email: "jeuwaummukuza-1818@yopmail.com",
      password: hashedPassword
    });

    await admin.save();
    logger.info("✅ Admin created successfully");
    process.exit();
  })
  .catch(err => {
    adminLogger.error("❌ Error creating admin:", err);
    process.exit(1);
  });
