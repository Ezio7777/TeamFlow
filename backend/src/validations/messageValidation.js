const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ID format');

const messageSchema = {
  create: Joi.object({
    content: Joi.string().trim().min(1).max(2000).required(),
  }),

  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
    before: Joi.date().iso(),
  }),
};

module.exports = messageSchema;
