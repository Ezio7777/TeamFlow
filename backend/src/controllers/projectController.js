const Project = require('../models/Project');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const { logActivity } = require('../services/activityService');
const { ACTIVITY_TYPES } = require('../constants/activityTypes');

const getProjects = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const teamId = req.user.teamId;

  const filter = { teamId };
  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  const skip = (page - 1) * limit;
  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Project.countDocuments(filter),
  ]);

  const projectsWithStats = await Promise.all(
    projects.map(async (project) => {
      const taskStats = await Task.aggregate([
        { $match: { projectId: project._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);

      const stats = { todo: 0, 'in-progress': 0, done: 0, total: 0 };
      taskStats.forEach(({ _id, count }) => {
        stats[_id] = count;
        stats.total += count;
      });

      return { ...project.toObject(), taskStats: stats };
    })
  );

  return ApiResponse.success(res, {
    projects: projectsWithStats,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

const createProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const teamId = req.user.teamId;

  const project = await Project.create({ name, description, teamId, createdBy: req.user._id });
  await project.populate('createdBy', 'name email avatar');

  await logActivity({
    type: ACTIVITY_TYPES.PROJECT_CREATED,
    description: `${req.user.name} created project "${name}"`,
    userId: req.user._id,
    teamId,
    metadata: { projectId: project._id, projectName: name },
  });

  const io = req.app.get('io');
  io?.to(`team:${teamId}`).emit('project:created', project);

  return ApiResponse.created(res, project, 'Project created successfully');
});

const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const teamId = req.user.teamId;

  const project = await Project.findOneAndUpdate(
    { _id: id, teamId },
    { $set: req.body },
    { new: true, runValidators: true }
  ).populate('createdBy', 'name email avatar');

  if (!project) {
    return ApiResponse.error(res, 'Project not found', 404);
  }

  await logActivity({
    type: ACTIVITY_TYPES.PROJECT_UPDATED,
    description: `${req.user.name} updated project "${project.name}"`,
    userId: req.user._id,
    teamId,
    metadata: { projectId: project._id },
  });

  const io = req.app.get('io');
  io?.to(`team:${teamId}`).emit('project:updated', project);

  return ApiResponse.success(res, project, 'Project updated successfully');
});

const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const teamId = req.user.teamId;

  const project = await Project.findOneAndDelete({ _id: id, teamId });

  if (!project) {
    return ApiResponse.error(res, 'Project not found', 404);
  }

  await Task.deleteMany({ projectId: id });

  await logActivity({
    type: ACTIVITY_TYPES.PROJECT_DELETED,
    description: `${req.user.name} deleted project "${project.name}"`,
    userId: req.user._id,
    teamId,
    metadata: { projectName: project.name },
  });

  const io = req.app.get('io');
  io?.to(`team:${teamId}`).emit('project:deleted', { id });

  return ApiResponse.success(res, null, 'Project deleted successfully');
});

const getProjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const teamId = req.user.teamId;

  const project = await Project.findOne({ _id: id, teamId }).populate('createdBy', 'name email avatar');

  if (!project) {
    return ApiResponse.error(res, 'Project not found', 404);
  }

  return ApiResponse.success(res, project);
});

module.exports = { getProjects, createProject, updateProject, deleteProject, getProjectById };
