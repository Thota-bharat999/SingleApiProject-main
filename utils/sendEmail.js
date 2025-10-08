const sgMail = require("@sendgrid/mail");
const logger = require("../utils/logger");
require("dotenv").config();

const sendEmail = async ({ toEmail, subject, html }) => {
  try {
    if (!toEmail || !subject || !html) {
      logger.warn("⚠️ Missing toEmail, subject, or html in sendEmail");
      throw new Error("Missing toEmail, subject, or html");
    }

    const SENDGRID_API_KEY = process.env.Moonshade || process.env.MOONSHADE;
    const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL;

    sgMail.setApiKey(SENDGRID_API_KEY);

    logger.info(`[EMAIL] 📧 Preparing to send OTP email to: ${toEmail}`);

    const msg = {
      to: toEmail,
      from: {
        name: "APP Support",
        email: SUPPORT_EMAIL,
      },
      subject,
      html,
      text: html.replace(/<[^>]+>/g, ""),
    };

    const response = await sgMail.send(msg);
    logger.info(`[EMAIL] ✅ Email sent to: ${toEmail}`);
    logger.info(`[EMAIL] 📤 Response code: ${response[0].statusCode}`);
  } catch (error) {
    console.error("❌ EMAIL ERROR STACK:", error);
    logger.error(`❌ Email send failed to ${toEmail || "unknown"}: ${error.message}`);
    throw error;
  }
};

module.exports = sendEmail;
