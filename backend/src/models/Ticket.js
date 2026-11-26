const mongoose = require('mongoose');

const CATEGORIES = ['TECHNICAL', 'BILLING', 'ACCOUNT', 'GENERAL'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: CATEGORIES,
      required: true,
    },
    priority: {
      type: String,
      enum: PRIORITIES,
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'OPEN',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

ticketSchema.index({ createdBy: 1, status: 1 });
ticketSchema.index({ status: 1, priority: 1 });

ticketSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Ticket', ticketSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.PRIORITIES = PRIORITIES;
module.exports.STATUSES = STATUSES;
