const nodemailer = require("nodemailer");
const logger = require("../utils/logger");
require("dotenv").config();

const sendEmail = async ({ toEmail, subject, html }) => {
  try {
    if (!toEmail || !subject || !html) {
      logger.warn("⚠️ Missing toEmail, subject, or html in sendEmail");
      throw new Error("Missing toEmail, subject, or html");
    }

    logger.info(`[EMAIL] 📧 Preparing to send OTP email to: ${toEmail}`);
    const start = Date.now();

    // 🔍 Support both upper & camelcase env names
    const SENDGRID_API_KEY = process.env.SendMoonApi || process.env.SENDMOONAPI;
    const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL;

    // Debugging logs
    console.log("=== EMAIL DEBUG START ===");
    console.log("SUPPORT_EMAIL:", SUPPORT_EMAIL || "❌ Not set");
    console.log("SENDGRID_API_KEY exists?:", !!SENDGRID_API_KEY);
    console.log("SENDGRID_API_KEY (first 6 chars):", SENDGRID_API_KEY ? SENDGRID_API_KEY.slice(0, 6) + "..." : "❌ Not set");
    console.log("=== EMAIL DEBUG END ===");

    const transporter = nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false,
      auth: {
        user: "apikey", // ✅ always "apikey"
        pass: SENDGRID_API_KEY,
      },
    });

    const mailOptions = {
      from: `"APP Support" <${SUPPORT_EMAIL}>`,
      to: toEmail,
      subject,
      html,
      text: html.replace(/<[^>]+>/g, ""), // fallback plain text
    };

    const result = await transporter.sendMail(mailOptions);
    const duration = Date.now() - start;

    logger.info(`[EMAIL] ✅ Email sent to: ${toEmail}`);
    logger.info(`[EMAIL] 📤 SMTP response: ${result.response}`);
    logger.info(`[EMAIL] ⏱ Sent in ${duration} ms`);
    logger.info(`[EMAIL] 📩 Message ID: ${result.messageId}`);

  } catch (error) {
    console.error("❌ EMAIL ERROR STACK:", error);
    logger.error(`❌ Email send failed to ${toEmail || "unknown"}: ${error.message}`);
    throw error;
  }
};

module.exports = sendEmail;
