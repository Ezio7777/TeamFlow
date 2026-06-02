const Joi = require('joi');
const { ROLES } = require('../constants/roles');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ID format');

const userSchema = {
  register: Joi.object({
    firebaseUid: Joi.string().required(),
    email: Joi.string().email().lowercase().required(),
    name: Joi.string().trim().min(2).max(100).required(),
    role: Joi.string().valid(...Object.values(ROLES)).default(ROLES.MEMBER),
    teamId: objectId.allow(null).default(null),
  }),

  updateRole: Joi.object({
    userId: objectId.required(),
    role: Joi.string().valid(...Object.values(ROLES)).required(),
  }),

  params: Joi.object({
    id: objectId.required(),
  }),
};

module.exports = userSchema;
