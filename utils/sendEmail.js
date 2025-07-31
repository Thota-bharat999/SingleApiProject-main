const nodemailer = require("nodemailer");
const logger = require("../utils/logger");
require('dotenv').config();

const sendEmail = async ({ toEmail, subject, html }) => {
  try {
    if (!toEmail || !subject || !html) {
      logger.warn("⚠️ Missing toEmail, subject, or html in sendEmail");
      throw new Error("Missing toEmail, subject, or html");
    }

    logger.info(`[EMAIL] 📧 Preparing to send OTP email to: ${toEmail}`);
    const start = Date.now();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"APP Support" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject,
      html,
      text: html.replace(/<[^>]+>/g, ''),
    };
  

    const result = await transporter.sendMail(mailOptions);
    const duration = Date.now() - start;

    logger.info(`[EMAIL] ✅ Email sent to: ${toEmail}`);
    logger.info(`[EMAIL] 📤 Gmail response: ${result.response}`);
    logger.info(`[EMAIL] ⏱ Email sent in ${duration} ms`);
    logger.info(`[EMAIL] 📩 Message ID: ${result.messageId}`);

  } catch (error) {
    logger.error(`❌ Email send failed to ${toEmail || "unknown"}: ${error.message}`);
    throw error;
  }
};

module.exports = sendEmail;
