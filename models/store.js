// Singleton in-memory stores.
// Replace with Redis in production.

const otpStore      = new Map(); // phone       → { otp, expiresAt }
const entryOtpStore = new Map(); // ticketId    → { otp, expiresAt, phone, eventId }
const userSessions  = new Map(); // phone       → { lastLogin }

module.exports = { otpStore, entryOtpStore, userSessions };
