const { ethers } = require('ethers');

function hashPhone(phone, eventId, salt = process.env.SALT || 'default_salt') {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(phone + eventId + salt));
}

function hashPayment(paymentRef) {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(paymentRef));
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isValidPhone(phone) {
  return /^\d{10}$/.test(phone);
}

module.exports = { hashPhone, hashPayment, generateOTP, isValidPhone };
