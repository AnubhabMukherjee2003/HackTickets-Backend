const router = require('express').Router();
const { sendOtp, verifyOtp, refreshToken } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { otpLimiter, loginLimiter } = require('../middleware/rateLimiter');

router.post('/send-otp',   otpLimiter,   sendOtp);
router.post('/verify-otp', loginLimiter, verifyOtp);
router.post('/refresh',    authenticateToken, refreshToken);

module.exports = router;
