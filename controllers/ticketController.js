const { getContract } = require('../config/blockchain');
const { hashPhone, hashPayment } = require('../utils/crypto');

async function bookTicket(req, res) {
  try {
    const contract = getContract();
    const { eventId, paymentReference } = req.body;
    const phone = req.user.phone;

    if (!eventId || !paymentReference) {
      return res.status(400).json({ error: 'Event ID and payment reference required' });
    }

    const event = await contract.getEvent(eventId);
    if (!event.active) {
      return res.status(400).json({ error: 'Event is not active' });
    }
    if (Number(event.ticketsSold) >= Number(event.capacity)) {
      return res.status(400).json({ error: 'Event is sold out' });
    }

    const phoneHash = hashPhone(phone, eventId);
    const paymentId = hashPayment(paymentReference);

    const tx = await contract.mintTicket(eventId, phoneHash, paymentId);
    const receipt = await tx.wait();

    const mintedEvent = receipt.events?.find(e => e.event === 'TicketMinted');
    const ticketId = mintedEvent ? mintedEvent.args.ticketId.toString() : 'unknown';

    res.json({
      success: true,
      ticketId,
      eventId,
      transactionHash: tx.hash,
      message: 'Ticket booked successfully'
    });
  } catch (error) {
    console.error('bookTicket error:', error);
    res.status(500).json({ error: error.message });
  }
}

async function getMyBookings(req, res) {
  try {
    const contract = getContract();
    const phone = req.user.phone;
    const { eventId } = req.query;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID required' });
    }

    const phoneHash = hashPhone(phone, eventId);
    const ticketIds = await contract.getUserTickets(phoneHash);
    const tickets = [];

    for (const ticketId of ticketIds) {
      const ticket = await contract.getTicket(ticketId);
      const event = await contract.getEvent(ticket.eventId.toString());
      tickets.push({
        ticketId: ticketId.toString(),
        eventId: ticket.eventId.toString(),
        eventName: event.name,
        eventLocation: event.location,
        eventDate: event.date.toString(),
        used: ticket.used,
        paymentId: ticket.paymentId
      });
    }

    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getAllBookings(req, res) {
  try {
    const contract = getContract();
    const phone = req.user.phone;
    const totalEvents = await contract.totalEvents();
    const allTickets = [];

    for (let eventId = 0; eventId < Number(totalEvents); eventId++) {
      try {
        const phoneHash = hashPhone(phone, eventId);
        const ticketIds = await contract.getUserTickets(phoneHash);

        for (const ticketId of ticketIds) {
          const ticket = await contract.getTicket(ticketId);
          const event = await contract.getEvent(ticket.eventId.toString());
          allTickets.push({
            ticketId: ticketId.toString(),
            eventId: ticket.eventId.toString(),
            eventName: event.name,
            eventLocation: event.location,
            eventDate: event.date.toString(),
            eventPrice: event.price.toString(),
            used: ticket.used,
            paymentId: ticket.paymentId
          });
        }
      } catch (_) {
        // No tickets for this event — skip
      }
    }

    res.json(allTickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { bookTicket, getMyBookings, getAllBookings };
