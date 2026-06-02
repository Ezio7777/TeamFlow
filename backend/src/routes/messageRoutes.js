const express = require('express');
const router = express.Router();
const { getMessages, createMessage } = require('../controllers/messageController');
const authenticate = require('../middleware/auth');
const { requireTeam } = require('../middleware/roleCheck');
const validate = require('../middleware/validate');
const messageSchema = require('../validations/messageValidation');

router.use(authenticate, requireTeam);

router.get('/', validate(messageSchema.query, 'query'), getMessages);
router.post('/', validate(messageSchema.create), createMessage);

module.exports = router;
