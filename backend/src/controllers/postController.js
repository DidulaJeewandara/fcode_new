const prisma = require('../utils/prisma');
const { NOTIFICATION_TYPES, createNotification } = require('../services/notificationService');
const { isNonEmptyString } = require('../utils/validators');

const MAX_CONTENT_LENGTH = 3000;

const authorSelect = {
  id: true,
  name: true,
  headline: true,
  profilePicture: true,
};

const commentAuthorSelect = {
  id: true,
  name: true,
  profilePicture: true,
};

const shapePost = (post, currentUserId) => ({
  id: post.id,
  content: post.content,
  imageUrl: post.imageUrl,
  shareCount: post.shareCount,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
  author: post.author,
  likeCount: post._count?.likes ?? 0,
  commentCount: post._count?.comments ?? 0,
  isLiked: post.likes ? post.likes.some((like) => like.userId === currentUserId) : false,
});

const getFeed = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          author: { select: authorSelect },
          _count: { select: { likes: true, comments: true } },
          likes: { where: { userId: req.user.id }, select: { userId: true } },
        },
      }),
      prisma.post.count(),
    ]);

    res.status(200).json({
      posts: posts.map((post) => shapePost(post, req.user.id)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

const getPostById = async (req, res, next) => {
  try {
    const postId = parseInt(req.params.postId, 10);
    if (Number.isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: authorSelect },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { userId: req.user.id }, select: { userId: true } },
      },
    });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.status(200).json({ post: shapePost(post, req.user.id) });
  } catch (error) {
    next(error);
  }
};

const createPost = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!isNonEmptyString(content)) {
      return res.status(400).json({ message: 'Post content is required' });
    }
    if (content.trim().length > MAX_CONTENT_LENGTH) {
      return res.status(400).json({ message: `Post content must be under ${MAX_CONTENT_LENGTH} characters` });
    }

    const imageUrl = req.file ? `/uploads/post-images/${req.file.filename}` : null;

    const post = await prisma.post.create({
      data: { content: content.trim(), imageUrl, authorId: req.user.id },
      include: {
        author: { select: authorSelect },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { userId: req.user.id }, select: { userId: true } },
      },
    });

    res.status(201).json({ post: shapePost(post, req.user.id) });
  } catch (error) {
    next(error);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const postId = parseInt(req.params.postId, 10);
    if (Number.isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (post.authorId !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own posts' });
    }

    const { content } = req.body;
    if (!isNonEmptyString(content)) {
      return res.status(400).json({ message: 'Post content is required' });
    }
    if (content.trim().length > MAX_CONTENT_LENGTH) {
      return res.status(400).json({ message: `Post content must be under ${MAX_CONTENT_LENGTH} characters` });
    }

    const updated = await prisma.post.update({
      where: { id: postId },
      data: { content: content.trim() },
      include: {
        author: { select: authorSelect },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { userId: req.user.id }, select: { userId: true } },
      },
    });

    res.status(200).json({ post: shapePost(updated, req.user.id) });
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const postId = parseInt(req.params.postId, 10);
    if (Number.isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (post.authorId !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }

    await prisma.post.delete({ where: { id: postId } });
    res.status(200).json({ message: 'Post deleted' });
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

const sharePost = async (req, res, next) => {
  try {
    const postId = parseInt(req.params.postId, 10);
    if (Number.isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const updated = await prisma.post.update({
      where: { id: postId },
      data: { shareCount: { increment: 1 } },
    });

    res.status(200).json({ shareCount: updated.shareCount });
  } catch (error) {
    next(error);
  }
};

const getComments = async (req, res, next) => {
  try {
    const postId = parseInt(req.params.postId, 10);
    if (Number.isNaN(postId)) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { postId },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        include: { user: { select: commentAuthorSelect } },
      }),
      prisma.comment.count({ where: { postId } }),
    ]);

    res.status(200).json({ comments, page, limit, total, totalPages: Math.ceil(total / limit) });
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
    if (!isNonEmptyString(content)) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    if (content.trim().length > MAX_CONTENT_LENGTH) {
      return res.status(400).json({ message: `Comment must be under ${MAX_CONTENT_LENGTH} characters` });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = await prisma.comment.create({
      data: { content: content.trim(), userId: req.user.id, postId },
      include: { user: { select: commentAuthorSelect } },
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

module.exports = {
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
};
