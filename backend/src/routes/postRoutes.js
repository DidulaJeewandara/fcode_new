const express = require('express');
const {
  getFeed,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  sharePost,
  getComments,
  addComment,
} = require('../controllers/postController');
const authMiddleware = require('../middleware/auth');
const { uploadPostImage } = require('../middleware/upload');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getFeed);
router.post('/', uploadPostImage.single('image'), createPost);

router.post('/:postId/like', likePost);
router.delete('/:postId/like', unlikePost);
router.post('/:postId/share', sharePost);
router.get('/:postId/comments', getComments);
router.post('/:postId/comments', addComment);

router.get('/:postId', getPostById);
router.put('/:postId', updatePost);
router.delete('/:postId', deletePost);

module.exports = router;
