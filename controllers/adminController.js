const { getContract } = require('../config/blockchain');
const { hashPhone } = require('../utils/crypto');

async function createEvent(req, res) {
  try {
    const contract = getContract();
    const { name, location, date, price, capacity } = req.body;

    if (!name || !location || !date || !price || !capacity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const tx = await contract.createEvent(name, location, date, price, capacity);
    const receipt = await tx.wait();

    const createdEvent = receipt.events?.find(e => e.event === 'EventCreated');
    const eventId = createdEvent ? createdEvent.args.eventId.toString() : 'unknown';

    res.json({ success: true, eventId, transactionHash: tx.hash });
  } catch (error) {
    console.error('createEvent error:', error);
    res.status(500).json({ error: error.message });
  }
}

async function setEventStatus(req, res) {
  try {
    const contract = getContract();
    const { eventId } = req.params;
    const { active } = req.body;

    const tx = await contract.setEventStatus(eventId, active);
    await tx.wait();

    res.json({ success: true, eventId, active, transactionHash: tx.hash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getTicketDetails(req, res) {
  try {
    const contract = getContract();
    const { ticketId } = req.params;
    const ticket = await contract.getTicket(ticketId);
    const event = await contract.getEvent(ticket.eventId.toString());

    res.json({
      ticketId,
      eventId: ticket.eventId.toString(),
      eventName: event.name,
      eventLocation: event.location,
      eventDate: event.date.toString(),
      phoneHash: ticket.phoneHash,
      used: ticket.used,
      paymentId: ticket.paymentId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function useTicketDirect(req, res) {
  try {
    const contract = getContract();
    const { ticketId } = req.params;
    const { userPhone, eventId } = req.body;

    if (!userPhone || !eventId) {
      return res.status(400).json({ error: 'userPhone and eventId required' });
    }

    const phoneHash = hashPhone(userPhone, eventId);
    const tx = await contract.markAsUsed(ticketId, phoneHash);
    await tx.wait();

    res.json({ success: true, ticketId, transactionHash: tx.hash, message: 'Ticket marked as used' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { createEvent, setEventStatus, getTicketDetails, useTicketDirect };
