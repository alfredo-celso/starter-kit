const nodemailer = require('nodemailer');
require('dotenv').config();
const i18next = require('i18next'); // 👈 Import i18next to implement lang

// Setup Gmail transport using SSL (port 465)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: true, // true for port 465 (SSL)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const MailerService = {
  /**
   * Send 6 digits verification code to user
   */
  async sendVerificationCode(toEmail, code, lng) {
    const mailOptions = {
      from: `"Starter Kit Auth" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: i18next.t('mail_subject', { lng }),
      // Version in txt if email customer does not soport HTML
      text: `${i18next.t('mail_text', { lng })}: ${code}`,
      // Version HTML
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; border: 1px solid #eee; margin: auto;">
          <h2 style="color: #333; text-align: center;">${i18next.t('mail_title', { lng })}</h2>
          <p style="font-size: 16px; color: #555;">${i18next.t('mail_body', { lng })}</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff; margin: 20px 0; border-radius: 5px;">
            ${code}
          </div>
          <p style="font-size: 12px; color: #999; text-align: center;">${i18next.t('mail_footer', { lng })}</p>
        </div>
      `,
    };

    // Send email asyncronous way
    return await transporter.sendMail(mailOptions);
  }
};

module.exports = MailerService;
