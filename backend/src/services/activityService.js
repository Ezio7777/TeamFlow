const Activity = require('../models/Activity');

const logActivity = async ({ type, description, userId, teamId, metadata = {} }) => {
  try {
    await Activity.create({ type, description, userId, teamId, metadata });
  } catch (error) {
    console.error('Failed to log activity:', error.message);
  }
};

module.exports = { logActivity };
