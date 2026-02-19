const { getContract } = require('../config/blockchain');

async function getAllEvents(req, res) {
  try {
    const contract = getContract();
    const totalEvents = await contract.totalEvents();
    const totalEventsNum = Number(totalEvents);
    const events = [];

    for (let i = 0; i < totalEventsNum; i++) {
      try {
        const event = await contract.getEvent(i);
        events.push({
          eventId: i,
          name: event.name,
          location: event.location,
          date: event.date.toString(),
          price: event.price.toString(),
          capacity: event.capacity.toString(),
          ticketsSold: event.ticketsSold.toString(),
          active: event.active,
          availableTickets: (Number(event.capacity) - Number(event.ticketsSold)).toString()
        });
      } catch (err) {
        console.error(`Error fetching event ${i}:`, err.message);
      }
    }

    res.json(events);
  } catch (error) {
    console.error('getAllEvents error:', error);
    res.status(500).json({ error: error.message });
  }
}

async function getEventById(req, res) {
  try {
    const contract = getContract();
    const { eventId } = req.params;
    const event = await contract.getEvent(eventId);

    res.json({
      eventId,
      name: event.name,
      location: event.location,
      date: event.date.toString(),
      price: event.price.toString(),
      capacity: event.capacity.toString(),
      ticketsSold: event.ticketsSold.toString(),
      active: event.active,
      availableTickets: (Number(event.capacity) - Number(event.ticketsSold)).toString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { getAllEvents, getEventById };
