const express = require('express');
const {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  removeConnection,
  getMyConnections,
  getIncomingRequests,
} = require('../controllers/connectionController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getMyConnections);
router.get('/requests', getIncomingRequests);
router.post('/:userId', sendConnectionRequest);
router.patch('/:requestId/accept', acceptConnectionRequest);
router.patch('/:requestId/reject', rejectConnectionRequest);
router.delete('/:userId', removeConnection);

module.exports = router;
