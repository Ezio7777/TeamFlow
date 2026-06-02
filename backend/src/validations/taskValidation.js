const Joi = require('joi');
const { TASK_STATUS_LIST } = require('../constants/taskStatus');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ID format');

const taskSchema = {
  create: Joi.object({
    title: Joi.string().trim().min(2).max(200).required(),
    description: Joi.string().trim().max(2000).allow('').default(''),
    status: Joi.string().valid(...TASK_STATUS_LIST).default('todo'),
    projectId: objectId.required(),
    assignedTo: objectId.allow(null).default(null),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
    dueDate: Joi.date().iso().allow(null).default(null),
  }),

  update: Joi.object({
    title: Joi.string().trim().min(2).max(200),
    description: Joi.string().trim().max(2000).allow(''),
    status: Joi.string().valid(...TASK_STATUS_LIST),
    assignedTo: objectId.allow(null),
    priority: Joi.string().valid('low', 'medium', 'high'),
    dueDate: Joi.date().iso().allow(null),
  }).min(1),

  params: Joi.object({
    id: objectId.required(),
  }),

  query: Joi.object({
    projectId: objectId,
    status: Joi.string().valid(...TASK_STATUS_LIST, 'all').allow(''),
    search: Joi.string().trim().max(100).allow(''),
    assignedTo: objectId,
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
  }),
};

module.exports = taskSchema;
