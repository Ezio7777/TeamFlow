const express = require('express');
const router = express.Router();
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const authenticate = require('../middleware/auth');
const { requireRole, requireTeam } = require('../middleware/roleCheck');
const validate = require('../middleware/validate');
const taskSchema = require('../validations/taskValidation');
const { ROLES } = require('../constants/roles');

router.use(authenticate, requireTeam);

router.get('/', validate(taskSchema.query, 'query'), getTasks);

router.post(
  '/',
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  validate(taskSchema.create),
  createTask
);

router.put(
  '/:id',
  validate(taskSchema.params, 'params'),
  validate(taskSchema.update),
  updateTask
);

router.delete(
  '/:id',
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  validate(taskSchema.params, 'params'),
  deleteTask
);

module.exports = router;
