const { EventEmitter } = require('events');
const ActivityLog = require('../models/ActivityLog');

const ticketEmitter = new EventEmitter();
let listenersRegistered = false;

const EVENT_TO_ACTION = {
  'ticket:created': 'CREATED',
  'ticket:updated': 'UPDATED',
  'ticket:status_changed': 'STATUS_CHANGED',
  'ticket:commented': 'COMMENTED',
  'ticket:resolved': 'RESOLVED',
};

function describe(eventName, payload) {
  if (payload.details) {
    return payload.details;
  }
  if (eventName === 'ticket:created') {
    return 'Ticket created';
  }
  if (eventName === 'ticket:status_changed') {
    return `Status changed from ${payload.oldStatus} to ${payload.newStatus}`;
  }
  if (eventName === 'ticket:commented') {
    return 'Comment added';
  }
  if (eventName === 'ticket:resolved') {
    return 'Ticket marked as resolved';
  }
  return 'Ticket updated';
}

function registerListeners() {
  if (listenersRegistered) {
    return;
  }
  listenersRegistered = true;

  Object.keys(EVENT_TO_ACTION).forEach((eventName) => {
    ticketEmitter.on(eventName, async (payload) => {
      await ActivityLog.create({
        ticketId: payload.ticketId,
        actorId: payload.actorId,
        action: EVENT_TO_ACTION[eventName],
        details: describe(eventName, payload),
      });
    });
  });
}

async function emitAsync(eventName, payload) {
  const listeners = ticketEmitter.listeners(eventName);
  await Promise.all(
    listeners.map(async (listener) => {
      try {
        await listener(payload);
      } catch (error) {
        console.error(`[ticket event] ${eventName} handler failed:`, error.message);
      }
    })
  );
}

ticketEmitter.emitAsync = emitAsync;

registerListeners();

module.exports = {
  ticketEmitter,
};
