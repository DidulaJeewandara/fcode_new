const prisma = require('../utils/prisma');
const { NOTIFICATION_TYPES, createNotification } = require('../services/notificationService');

const createPost = async (req, res, next) => {
  try {
    const { content, imageUrl } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Post content is required' });
    }

    const post = await prisma.post.create({
      data: { content: content.trim(), imageUrl: imageUrl || null, authorId: req.user.id },
    });

    res.status(201).json({ post });
  } catch (error) {
    next(error);
  }
};

const likePost = async (req, res, next) => {
  try {
    const postId = parseInt(req.params.postId, 10);
    if (Number.isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId: req.user.id, postId } },
    });
    if (existing) {
      return res.status(409).json({ message: 'You already liked this post' });
    }

    const like = await prisma.like.create({ data: { userId: req.user.id, postId } });

    await createNotification({
      recipientId: post.authorId,
      senderId: req.user.id,
      type: NOTIFICATION_TYPES.POST_LIKE,
      message: `${req.user.name} liked your post.`,
      relatedId: postId,
    });

    res.status(201).json({ like });
  } catch (error) {
    next(error);
  }
};

const unlikePost = async (req, res, next) => {
  try {
    const postId = parseInt(req.params.postId, 10);
    if (Number.isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId: req.user.id, postId } },
    });
    if (!existing) {
      return res.status(404).json({ message: 'You have not liked this post' });
    }

    await prisma.like.delete({ where: { id: existing.id } });
    res.status(200).json({ message: 'Like removed' });
  } catch (error) {
    next(error);
  }
};

const addComment = async (req, res, next) => {
  try {
    const postId = parseInt(req.params.postId, 10);
    if (Number.isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = await prisma.comment.create({
      data: { content: content.trim(), userId: req.user.id, postId },
    });

    await createNotification({
      recipientId: post.authorId,
      senderId: req.user.id,
      type: NOTIFICATION_TYPES.POST_COMMENT,
      message: `${req.user.name} commented on your post.`,
      relatedId: postId,
    });

    res.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
};

module.exports = { createPost, likePost, unlikePost, addComment };
