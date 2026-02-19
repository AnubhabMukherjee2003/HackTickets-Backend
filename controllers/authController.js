const jwt = require('jsonwebtoken');
const { generateOTP, isValidPhone } = require('../utils/crypto');
const { otpStore, userSessions } = require('../models/store');

async function sendOtp(req, res) {
  try {
    const { phone } = req.body;

    if (!phone || !isValidPhone(phone)) {
      return res.status(400).json({ error: 'Valid 10-digit phone number required' });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + parseInt(process.env.OTP_EXPIRES_IN || '300000');

    otpStore.set(phone, { otp, expiresAt });

    console.log(`OTP for ${phone}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function verifyOtp(req, res) {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP required' });
    }

    const storedOTP = otpStore.get(phone);

    if (!storedOTP) {
      return res.status(400).json({ error: 'OTP not found or expired' });
    }
    if (Date.now() > storedOTP.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json({ error: 'OTP expired' });
    }
    if (storedOTP.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const token = jwt.sign(
      { phone, isAdmin: phone === process.env.ADMIN_PHONE },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    otpStore.delete(phone);
    userSessions.set(phone, { lastLogin: Date.now() });

    res.json({
      success: true,
      token,
      user: {
        phone,
        isAdmin: phone === process.env.ADMIN_PHONE
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

function refreshToken(req, res) {
  const token = jwt.sign(
    { phone: req.user.phone, isAdmin: req.user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
  res.json({ token });
}

module.exports = { sendOtp, verifyOtp, refreshToken };
