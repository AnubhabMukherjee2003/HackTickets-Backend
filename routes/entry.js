const router = require('express').Router();
const { scanQr, confirmEntry } = require('../controllers/entryController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// QR code URL: GET /verifyme/:ticketId/:userToken
// Mounted at root level in server.js (not under /api prefix)
router.get('/:ticketId/:userToken', authenticateToken, requireAdmin, scanQr);

module.exports = router;
