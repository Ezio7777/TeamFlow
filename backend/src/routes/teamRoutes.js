const express = require('express');
const router = express.Router();
const { getTeam, createTeam, joinTeam, updateMemberRole, removeMember, getTeamStats } = require('../controllers/teamController');
const authenticate = require('../middleware/auth');
const { requireRole, requireTeam } = require('../middleware/roleCheck');
const { ROLES } = require('../constants/roles');

router.use(authenticate);

router.post('/create', createTeam);
router.post('/join', joinTeam);

router.use(requireTeam);

router.get('/', getTeam);
router.get('/stats', getTeamStats);
router.put('/member-role', requireRole(ROLES.ADMIN), updateMemberRole);
router.delete('/members/:id', requireRole(ROLES.ADMIN), removeMember);

module.exports = router;
