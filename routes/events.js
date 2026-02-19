const router = require('express').Router();
const { getAllEvents, getEventById } = require('../controllers/eventController');

router.get('/',     getAllEvents);
router.get('/:eventId', getEventById);

module.exports = router;
