const mongoose = require('mongoose');
const { ACTIVITY_TYPES } = require('../constants/activityTypes');

const activitySchema = new mongoose.Schema(
  {
    type: { type: String, enum: Object.values(ACTIVITY_TYPES), required: true },
    description: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

activitySchema.index({ teamId: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
