const jwt = require('jsonwebtoken');
const { getContract } = require('../config/blockchain');
const { hashPhone, generateOTP, isValidPhone } = require('../utils/crypto');
const { entryOtpStore } = require('../models/store');

// GET /verifyme/:ticketId/:userToken  (Admin only)
// Decodes user JWT, validates ticket on-chain, generates entry OTP, returns ticket + phone.
async function scanQr(req, res) {
  try {
    const contract = getContract();
    const { ticketId, userToken } = req.params;

    let decoded;
    try {
      decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid or expired user token' });
    }

    const phone = decoded.phone;
    const ticket = await contract.getTicket(ticketId);
    const eventId = ticket.eventId.toString();

    const phoneHash = hashPhone(phone, eventId);
    if (ticket.phoneHash !== phoneHash) {
      return res.status(403).json({ error: 'Ticket does not belong to this user' });
    }
    if (ticket.used) {
      return res.status(400).json({ error: 'Ticket has already been used' });
    }

    const event = await contract.getEvent(eventId);

    const otp = generateOTP();
    const expiresAt = Date.now() + parseInt(process.env.OTP_EXPIRES_IN || '300000');
    entryOtpStore.set(ticketId.toString(), { otp, expiresAt, phone, eventId });

    console.log(`[ENTRY OTP] Ticket ${ticketId} | Phone ${phone}: ${otp}`);

    res.json({
      ticketId,
      eventId,
      eventName: event.name,
      eventLocation: event.location,
      eventDate: event.date.toString(),
      used: ticket.used,
      phone,
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (error) {
    console.error('scanQr error:', error);
    res.status(500).json({ error: error.message });
  }
}

// POST /api/entry/confirm  (Admin only)
// Admin verbally checks phone, user reads OTP → marks ticket used on-chain.
async function confirmEntry(req, res) {
  try {
    const contract = getContract();
    const { ticketId, phone, otp } = req.body;

    if (!ticketId || !phone || !otp) {
      return res.status(400).json({ error: 'ticketId, phone and otp are required' });
    }
    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: 'Invalid phone number (10 digits required)' });
    }

    const storedEntry = entryOtpStore.get(ticketId.toString());

    if (!storedEntry) {
      return res.status(400).json({ error: 'No pending entry for this ticket. Scan QR first.' });
    }
    if (Date.now() > storedEntry.expiresAt) {
      entryOtpStore.delete(ticketId.toString());
      return res.status(400).json({ error: 'OTP expired' });
    }
    if (storedEntry.phone !== phone) {
      return res.status(403).json({ error: 'Phone does not match the ticket owner' });
    }
    if (storedEntry.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    const { eventId } = storedEntry;
    const phoneHash = hashPhone(phone, eventId);
    const tx = await contract.markAsUsed(ticketId, phoneHash);
    await tx.wait();

    entryOtpStore.delete(ticketId.toString());

    res.json({
      success: true,
      message: 'Entry granted – ticket marked as used',
      ticketId,
      transactionHash: tx.hash
    });
  } catch (error) {
    console.error('confirmEntry error:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = { scanQr, confirmEntry };
