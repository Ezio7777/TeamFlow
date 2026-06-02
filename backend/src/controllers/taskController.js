const Task = require('../models/Task');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const { logActivity } = require('../services/activityService');
const { ACTIVITY_TYPES } = require('../constants/activityTypes');
const { ROLES } = require('../constants/roles');

const getTasks = asyncHandler(async (req, res) => {
  const { projectId, status, search, assignedTo, page = 1, limit = 50 } = req.query;
  const teamId = req.user.teamId;

  const projectFilter = { teamId };
  if (projectId) projectFilter._id = projectId;

  const validProjects = await Project.find(projectFilter).select('_id');
  const validProjectIds = validProjects.map((p) => p._id);

  const filter = { projectId: { $in: validProjectIds } };

  if (status && status !== 'all') filter.status = status;
  if (search) filter.title = { $regex: search, $options: 'i' };
  if (assignedTo) filter.assignedTo = assignedTo;

  if (req.user.role === ROLES.MEMBER) {
    filter.assignedTo = req.user._id;
  }

  const skip = (page - 1) * limit;
  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Task.countDocuments(filter),
  ]);

  return ApiResponse.success(res, {
    tasks,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  });
});

const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, projectId, assignedTo, priority, dueDate } = req.body;
  const teamId = req.user.teamId;

  const project = await Project.findOne({ _id: projectId, teamId });
  if (!project) {
    return ApiResponse.error(res, 'Project not found', 404);
  }

  const task = await Task.create({
    title, description, status, projectId, assignedTo, priority, dueDate,
    createdBy: req.user._id,
  });

  await task.populate([
    { path: 'assignedTo', select: 'name email avatar' },
    { path: 'createdBy', select: 'name email' },
    { path: 'projectId', select: 'name' },
  ]);

  await logActivity({
    type: ACTIVITY_TYPES.TASK_CREATED,
    description: `${req.user.name} created task "${title}" in project "${project.name}"`,
    userId: req.user._id,
    teamId,
    metadata: { taskId: task._id, projectId, taskTitle: title },
  });

  if (assignedTo) {
    await logActivity({
      type: ACTIVITY_TYPES.TASK_ASSIGNED,
      description: `Task "${title}" was assigned`,
      userId: req.user._id,
      teamId,
      metadata: { taskId: task._id, assignedTo },
    });
  }

  const io = req.app.get('io');
  io?.to(`team:${teamId}`).emit('task:created', task);

  return ApiResponse.created(res, task, 'Task created successfully');
});

const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const teamId = req.user.teamId;

  const validProjects = await Project.find({ teamId }).select('_id');
  const validProjectIds = validProjects.map((p) => p._id);

  let taskFilter = { _id: id, projectId: { $in: validProjectIds } };

  if (req.user.role === ROLES.MEMBER) {
    taskFilter.assignedTo = req.user._id;
    const allowedFields = { status: req.body.status };
    const task = await Task.findOneAndUpdate(
      taskFilter,
      { $set: allowedFields },
      { new: true }
    ).populate([
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email' },
      { path: 'projectId', select: 'name' },
    ]);

    if (!task) return ApiResponse.error(res, 'Task not found or access denied', 404);

    const io = req.app.get('io');
    io?.to(`team:${teamId}`).emit('task:updated', task);

    return ApiResponse.success(res, task, 'Task updated successfully');
  }

  const previousTask = await Task.findOne(taskFilter);
  if (!previousTask) return ApiResponse.error(res, 'Task not found', 404);

  const task = await Task.findOneAndUpdate(
    taskFilter,
    { $set: req.body },
    { new: true }
  ).populate([
    { path: 'assignedTo', select: 'name email avatar' },
    { path: 'createdBy', select: 'name email' },
    { path: 'projectId', select: 'name' },
  ]);

  const activityType = req.body.status && req.body.status !== previousTask.status
    ? ACTIVITY_TYPES.TASK_MOVED
    : req.body.assignedTo
    ? ACTIVITY_TYPES.TASK_ASSIGNED
    : ACTIVITY_TYPES.TASK_UPDATED;

  let description = `${req.user.name} updated task "${task.title}"`;
  if (activityType === ACTIVITY_TYPES.TASK_MOVED) {
    description = `${req.user.name} moved "${task.title}" to ${req.body.status}`;
  }

  await logActivity({ type: activityType, description, userId: req.user._id, teamId, metadata: { taskId: task._id } });

  const io = req.app.get('io');
  io?.to(`team:${teamId}`).emit('task:updated', task);

  return ApiResponse.success(res, task, 'Task updated successfully');
});

const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const teamId = req.user.teamId;

  const validProjects = await Project.find({ teamId }).select('_id');
  const validProjectIds = validProjects.map((p) => p._id);

  const task = await Task.findOneAndDelete({ _id: id, projectId: { $in: validProjectIds } });

  if (!task) return ApiResponse.error(res, 'Task not found', 404);

  await logActivity({
    type: ACTIVITY_TYPES.TASK_DELETED,
    description: `${req.user.name} deleted task "${task.title}"`,
    userId: req.user._id,
    teamId,
    metadata: { taskTitle: task.title },
  });

  const io = req.app.get('io');
  io?.to(`team:${teamId}`).emit('task:deleted', { id });

  return ApiResponse.success(res, null, 'Task deleted successfully');
});

module.exports = { getTasks, createTask, updateTask, deleteTask };
