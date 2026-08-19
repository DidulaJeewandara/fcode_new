const express = require('express');
const {
  startConversation,
  getMyConversations,
  getMessages,
  sendMessage,
} = require('../controllers/conversationController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.post('/', startConversation);
router.get('/', getMyConversations);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', sendMessage);

module.exports = router;
