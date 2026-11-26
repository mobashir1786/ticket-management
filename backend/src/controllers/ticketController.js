const asyncHandler = require('../utils/asyncHandler');
const ticketService = require('../services/ticketService');

const createTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.createTicket(req.user, req.validated.body);
  res.status(201).json({ success: true, data: ticket });
});

const listTickets = asyncHandler(async (req, res) => {
  const tickets = await ticketService.listTickets(req.user, req.validated.query);
  res.status(200).json({ success: true, data: tickets });
});

const getTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.getTicketById(req.user, req.validated.params.id);
  res.status(200).json({ success: true, data: ticket });
});

const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.updateTicket(
    req.user,
    req.validated.params.id,
    req.validated.body
  );
  res.status(200).json({ success: true, data: ticket });
});

const deleteTicket = asyncHandler(async (req, res) => {
  await ticketService.deleteTicket(req.user, req.validated.params.id);
  res.status(200).json({ success: true, message: 'Ticket deleted' });
});

const getStats = asyncHandler(async (req, res) => {
  const stats = await ticketService.getStats(req.user);
  res.status(200).json({ success: true, data: stats });
});

module.exports = {
  createTicket,
  listTickets,
  getTicket,
  updateTicket,
  deleteTicket,
  getStats,
};
