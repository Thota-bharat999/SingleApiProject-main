// sendEmail.js
const nodemailer = require("nodemailer");
const logger = require("../utils/logger");
require("dotenv").config();

/**
 * Sends an email using SendGrid SMTP via Nodemailer.
 * Requires:
 *  - MOONSHADE = SendGrid API key
 *  - SUPPORT_EMAIL = verified sender email address
 */
const sendEmail = async ({ toEmail, subject, html }) => {
  try {
    // Basic validation
    if (!toEmail || !subject || !html) {
      logger.warn("⚠️ Missing required parameters in sendEmail");
      throw new Error("Missing toEmail, subject, or html");
    }

    // Get environment variables
    const SENDGRID_API_KEY = process.env.MOONSHADE || process.env.Moonshade;
    const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL;

    // Validate configuration
    if (!SENDGRID_API_KEY) {
      throw new Error("SendGrid API key not found in environment variables (MOONSHADE)");
    }
    if (!SUPPORT_EMAIL) {
      throw new Error("SUPPORT_EMAIL not found in environment variables");
    }

    // Debug logs (optional)
    logger.info(`[EMAIL] Preparing to send mail to: ${toEmail}`);
    logger.info(`[EMAIL] From: ${SUPPORT_EMAIL}`);
    logger.info(`[EMAIL] Using SendGrid API Key (loaded): ${!!SENDGRID_API_KEY}`);

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false, // STARTTLS
      auth: {
        user: "apikey", // always literally "apikey"
        pass: process.env.Moonshade,
      },
    });

    // Mail options
    const mailOptions = {
      from: `"Moonshade Support" <${SUPPORT_EMAIL}>`,
      to: toEmail,
      subject,
      html,
      text: html.replace(/<[^>]+>/g, ""), // Fallback plain text
    };

    // Send email
    const start = Date.now();
    const result = await transporter.sendMail(mailOptions);
    const duration = Date.now() - start;

    // Success logs
    logger.info(`[EMAIL] ✅ Sent to: ${toEmail}`);
    logger.info(`[EMAIL] 📩 Message ID: ${result.messageId}`);
    logger.info(`[EMAIL] ⏱ Duration: ${duration} ms`);
    logger.info(`[EMAIL] 📤 SMTP Response: ${result.response}`);

    return result;

  } catch (error) {
    logger.error(`❌ Failed to send email to ${toEmail || "unknown"}: ${error.message}`);
    console.error("❌ EMAIL ERROR STACK:", error);
    throw error;
  }
};

module.exports = sendEmail;
