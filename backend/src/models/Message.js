const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

messageSchema.index({ teamId: 1, timestamp: -1 });

module.exports = mongoose.model('Message', messageSchema);
