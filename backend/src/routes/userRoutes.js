const express = require('express');
const router = express.Router();
const { registerUser, getMe, updateMe, getUsersByTeam } = require('../controllers/userController');
const authenticate = require('../middleware/auth');
const { requireTeam } = require('../middleware/roleCheck');
const validate = require('../middleware/validate');
const userSchema = require('../validations/userValidation');

router.post('/register', validate(userSchema.register), registerUser);

router.use(authenticate);

router.get('/me', getMe);
router.put('/me', updateMe);
router.get('/team-members', requireTeam, getUsersByTeam);

module.exports = router;
