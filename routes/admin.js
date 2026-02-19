const router = require('express').Router();
const { createEvent, setEventStatus, getTicketDetails, useTicketDirect } = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.post('/events',                    authenticateToken, requireAdmin, createEvent);
router.patch('/events/:eventId/status',   authenticateToken, requireAdmin, setEventStatus);
router.get('/tickets/:ticketId',          authenticateToken, requireAdmin, getTicketDetails);
router.post('/tickets/:ticketId/use',     authenticateToken, requireAdmin, useTicketDirect);

module.exports = router;
