const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./Admin/authModel"); // Adjust path
const logger = require("./utils/logger");
const adminLogger = require("./utils/adminLogger");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      const existing = await Admin.findOne({ email: "moonshadeperfumes@gmail.com" });
      if (existing) {
        logger.warn("⚠️ Admin already exists. Skipping creation.");
        process.exit();
      }

      const hashedPassword = await bcrypt.hash("Moonshade@test", 15);
      const admin = new Admin({
        email: "moonshadeperfumes@gmail.com",
        password: hashedPassword
      });

      await admin.save();
      logger.info("✅ Admin created successfully");
      process.exit();
    } catch (err) {
      console.error(`[ADMIN] ❌ Error creating admin (inside then): ${err.message}`);
      console.error(err.stack);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error(`[ADMIN] ❌ Error connecting to DB: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  });
