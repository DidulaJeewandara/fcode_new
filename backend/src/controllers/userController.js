const prisma = require('../utils/prisma');
const { findConnectionBetween } = require('../utils/connectionStatus');

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  profilePicture: true,
  headline: true,
  bio: true,
  location: true,
  createdAt: true,
  updatedAt: true,
};

const listUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { id: { not: req.user.id } },
      select: {
        id: true,
        name: true,
        headline: true,
        profilePicture: true,
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...publicUserSelect,
        skills: { orderBy: { id: 'asc' } },
        education: { orderBy: { id: 'desc' } },
        experience: { orderBy: { id: 'desc' } },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [connectionCount, postCount] = await Promise.all([
      prisma.connection.count({
        where: {
          status: 'ACCEPTED',
          OR: [{ requesterId: userId }, { receiverId: userId }],
        },
      }),
      prisma.post.count({ where: { authorId: userId } }),
    ]);

    res.status(200).json({
      user: { ...user, connectionCount, postCount },
    });
  } catch (error) {
    next(error);
  }
};

const updateMyProfile = async (req, res, next) => {
  try {
    const { name, headline, bio, location } = req.body;

    const data = {};
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      data.name = name.trim();
    }
    if (headline !== undefined) data.headline = headline;
    if (bio !== undefined) data.bio = bio;
    if (location !== undefined) data.location = location;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: publicUserSelect,
    });

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

const uploadProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const profilePicture = `/uploads/profile-pictures/${req.file.filename}`;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { profilePicture },
      select: publicUserSelect,
    });

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

const getConnectionStatus = async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.userId, 10);
    if (Number.isNaN(targetUserId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    if (targetUserId === req.user.id) {
      return res.status(200).json({ status: 'SELF' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const connection = await findConnectionBetween(req.user.id, targetUserId);

    if (!connection || connection.status === 'REJECTED') {
      return res.status(200).json({ status: 'NOT_CONNECTED' });
    }

    if (connection.status === 'ACCEPTED') {
      return res.status(200).json({ status: 'CONNECTED', connectionId: connection.id });
    }

    // PENDING
    const direction = connection.requesterId === req.user.id ? 'OUTGOING' : 'INCOMING';
    return res.status(200).json({ status: 'PENDING', direction, requestId: connection.id });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listUsers,
  getUserProfile,
  updateMyProfile,
  uploadProfilePicture,
  getConnectionStatus,
};
