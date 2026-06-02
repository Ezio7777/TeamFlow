const Team = require('../models/Team');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Task = require('../models/Task');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const { ROLES } = require('../constants/roles');

const getTeam = asyncHandler(async (req, res) => {
  const teamId = req.user.teamId;

  const [team, members] = await Promise.all([
    Team.findById(teamId).populate('adminId', 'name email'),
    User.find({ teamId }).select('name email role avatar isOnline lastSeen'),
  ]);

  if (!team) return ApiResponse.error(res, 'Team not found', 404);

  return ApiResponse.success(res, { team, members });
});

const createTeam = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user._id;

  if (req.user.teamId) {
    return ApiResponse.error(res, 'You are already part of a team', 400);
  }

  const team = await Team.create({ name, description, adminId: userId });

  await User.findByIdAndUpdate(userId, {
    teamId: team._id,
    role: ROLES.ADMIN,
  });

  return ApiResponse.created(res, team, 'Team created successfully');
});

const joinTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.body;
  const userId = req.user._id;

  if (req.user.teamId) {
    return ApiResponse.error(res, 'You are already part of a team', 400);
  }

  const team = await Team.findById(teamId);
  if (!team) return ApiResponse.error(res, 'Team not found', 404);

  await User.findByIdAndUpdate(userId, { teamId: team._id });

  const io = req.app.get('io');
  io?.to(`team:${teamId}`).emit('team:member_joined', { userId, name: req.user.name });

  return ApiResponse.success(res, team, 'Joined team successfully');
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;
  const teamId = req.user.teamId;

  const targetUser = await User.findOne({ _id: userId, teamId });
  if (!targetUser) return ApiResponse.error(res, 'Member not found', 404);

  if (targetUser._id.toString() === req.user._id.toString()) {
    return ApiResponse.error(res, 'You cannot change your own role', 400);
  }

  targetUser.role = role;
  await targetUser.save();

  const io = req.app.get('io');
  io?.to(`team:${teamId}`).emit('team:role_updated', { userId, role });

  return ApiResponse.success(res, targetUser, 'Role updated successfully');
});

const removeMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const teamId = req.user.teamId;

  const targetUser = await User.findOne({ _id: id, teamId });
  if (!targetUser) return ApiResponse.error(res, 'Member not found', 404);

  if (targetUser._id.toString() === req.user._id.toString()) {
    return ApiResponse.error(res, 'You cannot remove yourself', 400);
  }

  await User.findByIdAndUpdate(id, { teamId: null, role: ROLES.MEMBER });

  return ApiResponse.success(res, null, 'Member removed successfully');
});

const getTeamStats = asyncHandler(async (req, res) => {
  const teamId = req.user.teamId;

  const projects = await Project.find({ teamId }).select('_id');
  const projectIds = projects.map((p) => p._id);

  const [totalProjects, taskStats, recentActivity] = await Promise.all([
    Project.countDocuments({ teamId }),
    Task.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Activity.find({ teamId })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(20),
  ]);

  const stats = { todo: 0, 'in-progress': 0, done: 0, total: 0 };
  taskStats.forEach(({ _id, count }) => {
    stats[_id] = count;
    stats.total += count;
  });

  return ApiResponse.success(res, {
    totalProjects,
    taskStats: stats,
    recentActivity,
  });
});

module.exports = { getTeam, createTeam, joinTeam, updateMemberRole, removeMember, getTeamStats };
