const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

const registerUser = asyncHandler(async (req, res) => {
  const { firebaseUid, email, name, role, teamId } = req.body;

  const existing = await User.findOne({ firebaseUid });
  if (existing) {
    return ApiResponse.success(res, existing, 'User already registered');
  }

  const user = await User.create({ firebaseUid, email, name, role, teamId });
  return ApiResponse.created(res, user, 'User registered successfully');
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('teamId', 'name description');
  return ApiResponse.success(res, user);
});

const updateMe = asyncHandler(async (req, res) => {
  const allowedUpdates = ['name', 'avatar'];
  const updates = {};
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  ).populate('teamId', 'name description');

  return ApiResponse.success(res, user, 'Profile updated successfully');
});

const getUsersByTeam = asyncHandler(async (req, res) => {
  const teamId = req.user.teamId;
  const users = await User.find({ teamId }).select('name email role avatar isOnline lastSeen');
  return ApiResponse.success(res, users);
});

module.exports = { registerUser, getMe, updateMe, getUsersByTeam };
