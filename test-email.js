const nodemailer = require("nodemailer");
require("dotenv").config();

async function main() {
  const transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    secure: false,
    auth: {
      user: "apikey",
      pass: process.env.SendMoonApi,
    },
  });

  try {
    let info = await transporter.sendMail({
      from: `"APP Support" <${process.env.SUPPORT_EMAIL}>`,
      to: "yourPersonalEmail@example.com", // test email (not yopmail)
      subject: "Test SendGrid Mail",
      text: "Hello! If you see this, SendGrid is working 🎉",
    });

    console.log("✅ Message sent:", info.messageId);
  } catch (err) {
    console.error("❌ Mail send error:", err);
  }
}

main();
