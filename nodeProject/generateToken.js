const jwt = require("jsonwebtoken");
const logger=require('./utils/logger')

const user = {
  id: "685983d8ac6bf907e59a4966", // make sure this matches your test user _id
  email: "john@example.com"
};

const token = jwt.sign(user, "my_super_secret_key", { expiresIn: "1h" });

logger.info("✅ New Valid Token:\n", token);
