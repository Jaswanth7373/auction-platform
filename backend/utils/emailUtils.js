const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter = null;

const createTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: parseInt(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: { rejectUnauthorized: false },
  });

  return transporter;
};

const baseTemplate = (content, title) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f0f1a; color: #e2e8f0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { color: #fff; font-size: 28px; font-weight: 800; letter-spacing: -1px; }
    .header span { color: #c4b5fd; font-size: 14px; }
    .body { background: #1a1a2e; padding: 40px 30px; border-radius: 0 0 12px 12px; }
    .otp-box { background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 48px; font-weight: 900; color: #fff; letter-spacing: 8px; font-family: monospace; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; margin: 20px 0; }
    .info-box { background: #0f0f1a; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #6366f1; }
    p { line-height: 1.7; color: #94a3b8; margin: 12px 0; }
    .footer { text-align: center; padding: 20px; color: #475569; font-size: 13px; }
    .divider { border: none; border-top: 1px solid #334155; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔨 AuctionPro</h1>
      <span>Premium Real-Time Auction Platform</span>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} AuctionPro. All rights reserved.</p>
      <p>This email was sent to you because you have an account with AuctionPro.</p>
    </div>
  </div>
</body>
</html>`;

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      logger.warn(`Email not sent (SMTP not configured): ${subject} to ${to}`);
      return false;
    }

    const t = createTransporter();
    const info = await t.sendMail({
      from: `"${process.env.FROM_NAME || 'AuctionPro'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    logger.info(`Email sent: ${info.messageId} to ${to}`);
    return true;
  } catch (error) {
    logger.error(`Email error: ${error.message}`);
    return false;
  }
};

// Send OTP email
const sendOTPEmail = async (email, name, otp, purpose = 'verification') => {
  const titles = { verification: 'Email Verification', reset: 'Password Reset', login: '2FA Code' };
  const title = titles[purpose] || 'OTP Code';

  const content = `
    <h2 style="color: #e2e8f0; font-size: 22px; margin-bottom: 8px;">Hello, ${name}! 👋</h2>
    <p>Your ${title} code is:</p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <p style="color: #c4b5fd; font-size: 13px; margin-top: 12px;">Valid for 10 minutes</p>
    </div>
    <div class="info-box">
      <p>🔒 <strong style="color: #e2e8f0;">Security Notice:</strong> Never share this code with anyone. AuctionPro staff will never ask for this code.</p>
    </div>
    <p>If you didn't request this, please ignore this email or contact support immediately.</p>`;

  return sendEmail({ to: email, subject: `${otp} - Your AuctionPro ${title} Code`, html: baseTemplate(content, title) });
};

// Send auction won email
const sendAuctionWonEmail = async (email, name, auction, winAmount) => {
  const content = `
    <h2 style="color: #e2e8f0;">🎉 Congratulations, ${name}!</h2>
    <p>You won the auction for:</p>
    <div class="info-box">
      <h3 style="color: #a78bfa; font-size: 18px;">${auction.title}</h3>
      <p>Winning Bid: <strong style="color: #10b981; font-size: 20px;">$${winAmount.toFixed(2)}</strong></p>
    </div>
    <p>Please complete your payment within 48 hours to secure your item.</p>
    <a href="${process.env.CLIENT_URL}/dashboard/wins" class="btn">Complete Payment</a>
    <hr class="divider">
    <p style="font-size: 13px; color: #64748b;">Failure to pay may result in a negative review and potential account restrictions.</p>`;

  return sendEmail({ to: email, subject: `🎉 You won: ${auction.title}!`, html: baseTemplate(content, 'Auction Won') });
};

// Send outbid notification
const sendOutbidEmail = async (email, name, auction, newBid) => {
  const content = `
    <h2 style="color: #e2e8f0;">You've been outbid! 📢</h2>
    <p>Someone placed a higher bid on:</p>
    <div class="info-box">
      <h3 style="color: #a78bfa;">${auction.title}</h3>
      <p>Current Highest Bid: <strong style="color: #f59e0b; font-size: 20px;">$${newBid.toFixed(2)}</strong></p>
    </div>
    <a href="${process.env.CLIENT_URL}/auctions/${auction._id}" class="btn">Bid Again Now</a>`;

  return sendEmail({ to: email, subject: `Outbid! Place a new bid on "${auction.title}"`, html: baseTemplate(content, 'Outbid Alert') });
};

// Welcome email
const sendWelcomeEmail = async (email, name) => {
  const content = `
    <h2 style="color: #e2e8f0;">Welcome to AuctionPro, ${name}! 🚀</h2>
    <p>Your account has been verified. You're all set to start bidding on amazing items!</p>
    <div class="info-box">
      <p>✅ Browse thousands of unique items</p>
      <p>🔨 Place real-time bids</p>
      <p>🏆 Win exclusive auctions</p>
    </div>
    <a href="${process.env.CLIENT_URL}/auctions" class="btn">Start Exploring</a>`;

  return sendEmail({ to: email, subject: 'Welcome to AuctionPro! 🎉', html: baseTemplate(content, 'Welcome') });
};

// Password reset email
const sendPasswordResetEmail = async (email, name, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  const content = `
    <h2 style="color: #e2e8f0;">Password Reset Request</h2>
    <p>Hi ${name}, we received a request to reset your password.</p>
    <a href="${resetUrl}" class="btn">Reset Password</a>
    <p style="font-size: 13px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>`;

  return sendEmail({ to: email, subject: 'Reset your AuctionPro password', html: baseTemplate(content, 'Password Reset') });
};

module.exports = { sendEmail, sendOTPEmail, sendAuctionWonEmail, sendOutbidEmail, sendWelcomeEmail, sendPasswordResetEmail };
