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

    // 🔍 Debug environment values
    console.log("=== EMAIL DEBUG START ===");
    console.log("SUPPORT_EMAIL:", process.env.SUPPORT_EMAIL || "❌ Not set");
    console.log("SendMoonApi exists?:", !!process.env.SendMoonApi);
    console.log("SendMoonApi (first 6 chars):", process.env.SendMoonApi ? process.env.SendMoonApi.slice(0, 6) + "..." : "❌ Not set");
    console.log("=== EMAIL DEBUG END ===");

    const transporter = nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false,
      auth: {
        user: "apikey", // ✅ this must literally be "apikey"
        pass: process.env.SendMoonApi,
      },
    });
console.log("=== TRANSPORTER CONFIG ===");
console.log(transporter.options);

    const mailOptions = {
      from: `"APP Support" <${process.env.SUPPORT_EMAIL}>`,
      to: toEmail,
      subject,
      html,
      text: html.replace(/<[^>]+>/g, ""),
    };

    const result = await transporter.sendMail(mailOptions);
    const duration = Date.now() - start;

    logger.info(`[EMAIL] ✅ Email sent to: ${toEmail}`);
    logger.info(`[EMAIL] 📤 SMTP response: ${result.response}`);
    logger.info(`[EMAIL] ⏱ Sent in ${duration} ms`);
    logger.info(`[EMAIL] 📩 Message ID: ${result.messageId}`);

  } catch (error) {
    console.error("❌ EMAIL ERROR STACK:", error); // 🔍 full error
    logger.error(`❌ Email send failed to ${toEmail || "unknown"}: ${error.message}`);
    throw error;
  }
};

module.exports = sendEmail;
