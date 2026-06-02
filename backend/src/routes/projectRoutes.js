const express = require('express');
const router = express.Router();
const { getProjects, createProject, updateProject, deleteProject, getProjectById } = require('../controllers/projectController');
const authenticate = require('../middleware/auth');
const { requireRole, requireTeam } = require('../middleware/roleCheck');
const validate = require('../middleware/validate');
const projectSchema = require('../validations/projectValidation');
const { ROLES } = require('../constants/roles');

router.use(authenticate, requireTeam);

router.get('/', validate(projectSchema.query, 'query'), getProjects);
router.get('/:id', validate(projectSchema.params, 'params'), getProjectById);

router.post(
  '/',
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  validate(projectSchema.create),
  createProject
);

router.put(
  '/:id',
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  validate(projectSchema.params, 'params'),
  validate(projectSchema.update),
  updateProject
);

router.delete(
  '/:id',
  requireRole(ROLES.ADMIN),
  validate(projectSchema.params, 'params'),
  deleteProject
);

module.exports = router;
