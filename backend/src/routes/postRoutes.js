const express = require('express');
const { createPost, likePost, unlikePost, addComment } = require('../controllers/postController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.post('/', createPost);
router.post('/:postId/like', likePost);
router.delete('/:postId/like', unlikePost);
router.post('/:postId/comments', addComment);

module.exports = router;
