const Message = require('../models/Message');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

const getMessages = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, before } = req.query;
  const teamId = req.user.teamId;

  const filter = { teamId };
  if (before) filter.timestamp = { $lt: new Date(before) };

  const skip = (page - 1) * limit;
  const messages = await Message.find(filter)
    .populate('senderId', 'name email avatar')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Message.countDocuments({ teamId });

  return ApiResponse.success(res, {
    messages: messages.reverse(),
    pagination: { total, page: Number(page), limit: Number(limit), hasMore: skip + messages.length < total },
  });
});

const createMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const teamId = req.user.teamId;

  const message = await Message.create({ content, senderId: req.user._id, teamId });
  await message.populate('senderId', 'name email avatar');

  const io = req.app.get('io');
  io?.to(`team:${teamId}`).emit('message:new', message);

  return ApiResponse.created(res, message, 'Message sent');
});

module.exports = { getMessages, createMessage };
