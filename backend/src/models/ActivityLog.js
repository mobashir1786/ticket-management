const mongoose = require('mongoose');

const ACTIONS = ['CREATED', 'UPDATED', 'STATUS_CHANGED', 'COMMENTED', 'RESOLVED'];

const activityLogSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: ACTIONS,
      required: true,
    },
    details: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

activityLogSchema.index({ ticketId: 1, createdAt: 1 });

activityLogSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
