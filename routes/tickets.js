const router = require('express').Router();
const { bookTicket, getMyBookings, getAllBookings } = require('../controllers/ticketController');
const { authenticateToken } = require('../middleware/auth');

router.post('/book',          authenticateToken, bookTicket);
router.get('/my-bookings',    authenticateToken, getMyBookings);
router.get('/all-bookings',   authenticateToken, getAllBookings);

module.exports = router;
