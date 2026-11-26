const Ticket = require('../models/Ticket');
const Comment = require('../models/Comment');
const ActivityLog = require('../models/ActivityLog');
const ApiError = require('../utils/ApiError');
const { ticketEmitter } = require('../events/ticketEvents');

function isOwner(ticket, actor) {
  return ticket.createdBy._id.toString() === actor.id;
}

function canView(ticket, actor) {
  return actor.role === 'ADMIN' || isOwner(ticket, actor);
}

async function createTicket(actor, input) {
  const ticket = await Ticket.create({
    title: input.title,
    description: input.description,
    category: input.category,
    priority: input.priority || 'MEDIUM',
    status: 'OPEN',
    createdBy: actor.id,
  });

  await ticketEmitter.emitAsync('ticket:created', {
    ticketId: ticket.id,
    actorId: actor.id,
    details: 'Ticket created',
  });

  return ticket;
}

async function listTickets(actor, query) {
  const filter = {};
  if (actor.role === 'USER') {
    filter.createdBy = actor.id;
  }
  if (query.status) {
    filter.status = query.status;
  }
  if (query.priority) {
    filter.priority = query.priority;
  }
  if (query.search) {
    const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { title: { $regex: escaped, $options: 'i' } },
      { description: { $regex: escaped, $options: 'i' } },
    ];
  }

  const page = query.page || 1;
  const limit = query.limit || 10;
  const sortDirection = query.sortOrder === 'asc' ? 1 : -1;
  const sortBy = query.sortBy || 'createdAt';
  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .sort({ [sortBy]: sortDirection })
      .skip((page - 1) * limit)
      .limit(limit),
    Ticket.countDocuments(filter),
  ]);

  return {
    tickets,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getStats(actor) {
  const filter = actor.role === 'USER' ? { createdBy: actor.id } : {};
  const [total, open, inProgress, resolved, closed] = await Promise.all([
    Ticket.countDocuments(filter),
    Ticket.countDocuments({ ...filter, status: 'OPEN' }),
    Ticket.countDocuments({ ...filter, status: 'IN_PROGRESS' }),
    Ticket.countDocuments({ ...filter, status: 'RESOLVED' }),
    Ticket.countDocuments({ ...filter, status: 'CLOSED' }),
  ]);
  return { total, open, inProgress, resolved, closed };
}

async function getTicketById(actor, ticketId) {
  const ticket = await Ticket.findById(ticketId).populate('createdBy', 'name email role');
  if (!ticket || !canView(ticket, actor)) {
    throw new ApiError(404, 'Ticket not found');
  }

  const [comments, activity] = await Promise.all([
    Comment.find({ ticketId: ticket.id })
      .populate('userId', 'name email role')
      .sort({ createdAt: 1 }),
    ActivityLog.find({ ticketId: ticket.id })
      .populate('actorId', 'name email role')
      .sort({ createdAt: 1 }),
  ]);

  return {
    ...ticket.toJSON(),
    comments,
    activity,
  };
}

async function updateTicket(actor, ticketId, input) {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket || !canView(ticket, actor)) {
    throw new ApiError(404, 'Ticket not found');
  }

  if (actor.role === 'USER') {
    if (!isOwner(ticket, actor)) {
      throw new ApiError(404, 'Ticket not found');
    }
    if (ticket.status !== 'OPEN') {
      throw new ApiError(403, 'Only open tickets can be edited');
    }

    ['title', 'description', 'category'].forEach((field) => {
      if (input[field] !== undefined) {
        ticket[field] = input[field];
      }
    });
    await ticket.save();

    const changed = Object.keys(input).join(', ');
    await ticketEmitter.emitAsync('ticket:updated', {
      ticketId: ticket.id,
      actorId: actor.id,
      details: `Updated fields: ${changed}`,
    });

    return ticket;
  }

  const oldStatus = ticket.status;
  if (input.priority !== undefined) {
    ticket.priority = input.priority;
  }
  if (input.status !== undefined) {
    ticket.status = input.status;
  }
  await ticket.save();

  if (input.priority !== undefined) {
    await ticketEmitter.emitAsync('ticket:updated', {
      ticketId: ticket.id,
      actorId: actor.id,
      details: `Priority set to ${ticket.priority}`,
    });
  }

  if (input.status !== undefined && input.status !== oldStatus) {
    await ticketEmitter.emitAsync('ticket:status_changed', {
      ticketId: ticket.id,
      actorId: actor.id,
      oldStatus,
      newStatus: input.status,
      details: `Status changed from ${oldStatus} to ${input.status}`,
    });

    if (input.status === 'RESOLVED') {
      await ticketEmitter.emitAsync('ticket:resolved', {
        ticketId: ticket.id,
        actorId: actor.id,
        details: 'Ticket marked as resolved',
      });
    }
  }

  return ticket;
}

async function deleteTicket(actor, ticketId) {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket || !isOwner(ticket, actor)) {
    throw new ApiError(404, 'Ticket not found');
  }
  if (ticket.status !== 'OPEN') {
    throw new ApiError(403, 'Only open tickets can be deleted');
  }

  await Comment.deleteMany({ ticketId: ticket.id });
  await ticket.deleteOne();
}

module.exports = {
  createTicket,
  listTickets,
  getStats,
  getTicketById,
  updateTicket,
  deleteTicket,
};
