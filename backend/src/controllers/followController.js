const prisma = require('../utils/prisma');

const basicUserSelect = {
  id: true,
  name: true,
  headline: true,
  profilePicture: true,
};

const followUser = async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.userId, 10);
    if (Number.isNaN(targetUserId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    if (targetUserId === req.user.id) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: req.user.id, followingId: targetUserId } },
    });
    if (existing) {
      return res.status(409).json({ message: 'You are already following this user' });
    }

    const follow = await prisma.follow.create({
      data: { followerId: req.user.id, followingId: targetUserId },
    });

    res.status(201).json({ follow });
  } catch (error) {
    next(error);
  }
};

const unfollowUser = async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.userId, 10);
    if (Number.isNaN(targetUserId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: req.user.id, followingId: targetUserId } },
    });
    if (!existing) {
      return res.status(404).json({ message: 'You are not following this user' });
    }

    await prisma.follow.delete({ where: { id: existing.id } });
    res.status(200).json({ message: 'Unfollowed successfully' });
  } catch (error) {
    next(error);
  }
};

const getFollowers = async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.userId, 10);
    if (Number.isNaN(targetUserId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const followers = await prisma.follow.findMany({
      where: { followingId: targetUserId },
      include: { follower: { select: basicUserSelect } },
      orderBy: { id: 'desc' },
    });

    res.status(200).json({ followers: followers.map((f) => f.follower) });
  } catch (error) {
    next(error);
  }
};

const getFollowing = async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.userId, 10);
    if (Number.isNaN(targetUserId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const following = await prisma.follow.findMany({
      where: { followerId: targetUserId },
      include: { following: { select: basicUserSelect } },
      orderBy: { id: 'desc' },
    });

    res.status(200).json({ following: following.map((f) => f.following) });
  } catch (error) {
    next(error);
  }
};

module.exports = { followUser, unfollowUser, getFollowers, getFollowing };
