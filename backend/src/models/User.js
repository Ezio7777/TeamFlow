const mongoose = require('mongoose');
const { ROLES } = require('../constants/roles');

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.MEMBER },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    avatar: { type: String, default: null },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.index({ teamId: 1 });

module.exports = mongoose.model('User', userSchema);
