const sgMail = require("@sendgrid/mail");
const logger = require("../utils/logger");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

/**
 * Send an email using SendGrid with a predefined HTML template
 * @param {Object} options
 * @param {string} options.toEmail - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} [options.otp] - OTP or dynamic content (optional)
 * @param {string} [options.userRole] - User role (e.g., "User", "Admin") (optional)
 * @param {string} [options.html] - Optional custom HTML (if provided, overrides template)
 */
const sendEmail = async ({ toEmail, subject, otp, userRole, html }) => {
  try {
    if (!toEmail || !subject) {
      logger.warn("⚠️ Missing toEmail or subject in sendEmail");
      throw new Error("Missing required parameters (toEmail or subject)");
    }

    const SENDGRID_API_KEY = process.env.Moonshade;
    const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL;

    if (!SENDGRID_API_KEY) {
      throw new Error("SendGrid API key not found in environment variables (Moonshade)");
    }

    if (!SUPPORT_EMAIL) {
      throw new Error("Support email not found in environment variables (SUPPORT_EMAIL)");
    }

    sgMail.setApiKey(SENDGRID_API_KEY);

    // ✅ If no HTML provided, load from template
    let emailHtml = html;
    if (!emailHtml) {
      const templatePath = path.join(__dirname, "../templates/otp-template.html");

      if (!fs.existsSync(templatePath)) {
        throw new Error("Email template not found at: " + templatePath);
      }

      emailHtml = fs.readFileSync(templatePath, "utf-8");

      // Replace placeholders dynamically
      emailHtml = emailHtml
        .replace(/{{OTP_CODE}}/g, otp || "----")
        .replace(/{{USER_ROLE}}/g, userRole || "User")
        .replace(/{{EMAIL}}/g, toEmail)
        .replace(/{{YEAR}}/g, new Date().getFullYear());
    }

    const msg = {
      to: toEmail,
      from: SUPPORT_EMAIL,
      subject,
      html: emailHtml,
      text: emailHtml.replace(/<[^>]+>/g, ""), // fallback plain text
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
