const Ticket = require('../models/Ticket');
const Comment = require('../models/Comment');
const ApiError = require('../utils/ApiError');
const { ticketEmitter } = require('../events/ticketEvents');

async function addComment(actor, ticketId, message) {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }

  const isOwner = ticket.createdBy.toString() === actor.id;
  if (actor.role !== 'ADMIN' && !isOwner) {
    throw new ApiError(404, 'Ticket not found');
  }
  if (ticket.status === 'CLOSED') {
    throw new ApiError(403, 'Closed tickets cannot receive comments');
  }

  const comment = await Comment.create({
    ticketId: ticket.id,
    userId: actor.id,
    message,
  });

  await ticketEmitter.emitAsync('ticket:commented', {
    ticketId: ticket.id,
    actorId: actor.id,
    commentId: comment.id,
    details: 'Comment added',
  });

  await comment.populate('userId', 'name email role');
  return comment;
}

module.exports = {
  addComment,
};
