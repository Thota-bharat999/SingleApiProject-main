const sgMail = require("@sendgrid/mail");
const logger = require("../utils/logger");
require("dotenv").config();

const sendEmail = async ({ toEmail, subject, html }) => {
  try {
    if (!toEmail || !subject || !html) {
      logger.warn("⚠️ Missing toEmail, subject, or html in sendEmail");
      throw new Error("Missing toEmail, subject, or html");
    }

    const SENDGRID_API_KEY = process.env.Moonshade;
    const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL;

    if (!SENDGRID_API_KEY) {
      throw new Error("SendGrid API key not found in environment variables (MOONSHADE)");
    }

    if (!SUPPORT_EMAIL) {
      throw new Error("Support email not found in environment variables (SUPPORT_EMAIL)");
    }

    sgMail.setApiKey(SENDGRID_API_KEY);

    const msg = {
      to: toEmail,
      from: SUPPORT_EMAIL,
      subject,
      html,
      text: html.replace(/<[^>]+>/g, ""), // fallback plain text
    };

    logger.info(`[EMAIL] 📧 Preparing to send via SendGrid API to: ${toEmail}`);
    const start = Date.now();

    await sgMail.send(msg);

    const duration = Date.now() - start;
    logger.info(`[EMAIL] ✅ Email sent successfully to: ${toEmail} in ${duration} ms`);

  } catch (error) {
    console.error("❌ EMAIL ERROR STACK:", error);
    logger.error(`❌ Failed to send email to ${toEmail || "unknown"}: ${error.message}`);
    throw error;
  }
};

module.exports = sendEmail;
