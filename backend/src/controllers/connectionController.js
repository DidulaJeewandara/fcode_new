const prisma = require('../utils/prisma');
const { CONNECTION_STATUS, findConnectionBetween } = require('../utils/connectionStatus');
const { NOTIFICATION_TYPES, createNotification } = require('../services/notificationService');

const basicUserSelect = {
  id: true,
  name: true,
  headline: true,
  profilePicture: true,
};

const sendConnectionRequest = async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.userId, 10);
    if (Number.isNaN(targetUserId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    if (targetUserId === req.user.id) {
      return res.status(400).json({ message: 'You cannot connect with yourself' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existing = await findConnectionBetween(req.user.id, targetUserId);

    if (existing) {
      if (existing.status === CONNECTION_STATUS.ACCEPTED) {
        return res.status(409).json({ message: 'You are already connected with this user' });
      }
      if (existing.status === CONNECTION_STATUS.PENDING) {
        return res.status(409).json({ message: 'A connection request is already pending' });
      }

      // Previously rejected — allow re-sending as a fresh request from this user.
      const connection = await prisma.connection.update({
        where: { id: existing.id },
        data: {
          requesterId: req.user.id,
          receiverId: targetUserId,
          status: CONNECTION_STATUS.PENDING,
          createdAt: new Date(),
        },
      });
      await createNotification({
        recipientId: targetUserId,
        senderId: req.user.id,
        type: NOTIFICATION_TYPES.CONNECTION_REQUEST,
        message: `${req.user.name} sent you a connection request.`,
        relatedId: connection.id,
      });
      return res.status(201).json({ connection });
    }

    const connection = await prisma.connection.create({
      data: {
        requesterId: req.user.id,
        receiverId: targetUserId,
        status: CONNECTION_STATUS.PENDING,
      },
    });

    await createNotification({
      recipientId: targetUserId,
      senderId: req.user.id,
      type: NOTIFICATION_TYPES.CONNECTION_REQUEST,
      message: `${req.user.name} sent you a connection request.`,
      relatedId: connection.id,
    });

    res.status(201).json({ connection });
  } catch (error) {
    next(error);
  }
};

const acceptConnectionRequest = async (req, res, next) => {
  try {
    const requestId = parseInt(req.params.requestId, 10);
    if (Number.isNaN(requestId)) {
      return res.status(400).json({ message: 'Invalid request id' });
    }

    const connection = await prisma.connection.findUnique({ where: { id: requestId } });
    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }
    if (connection.receiverId !== req.user.id) {
      return res.status(403).json({ message: 'You can only accept requests sent to you' });
    }
    if (connection.status !== CONNECTION_STATUS.PENDING) {
      return res.status(400).json({ message: 'This request is no longer pending' });
    }

    const updated = await prisma.connection.update({
      where: { id: requestId },
      data: { status: CONNECTION_STATUS.ACCEPTED },
    });

    await createNotification({
      recipientId: connection.requesterId,
      senderId: req.user.id,
      type: NOTIFICATION_TYPES.CONNECTION_ACCEPTED,
      message: `${req.user.name} accepted your connection request.`,
      relatedId: updated.id,
    });

    res.status(200).json({ connection: updated });
  } catch (error) {
    next(error);
  }
};

const rejectConnectionRequest = async (req, res, next) => {
  try {
    const requestId = parseInt(req.params.requestId, 10);
    if (Number.isNaN(requestId)) {
      return res.status(400).json({ message: 'Invalid request id' });
    }

    const connection = await prisma.connection.findUnique({ where: { id: requestId } });
    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }
    if (connection.receiverId !== req.user.id) {
      return res.status(403).json({ message: 'You can only reject requests sent to you' });
    }
    if (connection.status !== CONNECTION_STATUS.PENDING) {
      return res.status(400).json({ message: 'This request is no longer pending' });
    }

    const updated = await prisma.connection.update({
      where: { id: requestId },
      data: { status: CONNECTION_STATUS.REJECTED },
    });

    res.status(200).json({ connection: updated });
  } catch (error) {
    next(error);
  }
};

const removeConnection = async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.userId, 10);
    if (Number.isNaN(targetUserId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const connection = await findConnectionBetween(req.user.id, targetUserId);
    if (!connection || connection.status !== CONNECTION_STATUS.ACCEPTED) {
      return res.status(404).json({ message: 'No existing connection with this user' });
    }

    await prisma.connection.delete({ where: { id: connection.id } });
    res.status(200).json({ message: 'Connection removed' });
  } catch (error) {
    next(error);
  }
};

const getMyConnections = async (req, res, next) => {
  try {
    const connections = await prisma.connection.findMany({
      where: {
        status: CONNECTION_STATUS.ACCEPTED,
        OR: [{ requesterId: req.user.id }, { receiverId: req.user.id }],
      },
      include: {
        requester: { select: basicUserSelect },
        receiver: { select: basicUserSelect },
      },
      orderBy: { createdAt: 'desc' },
    });

    const users = connections.map((c) => (c.requesterId === req.user.id ? c.receiver : c.requester));

    res.status(200).json({ connections: users });
  } catch (error) {
    next(error);
  }
};

const getIncomingRequests = async (req, res, next) => {
  try {
    const requests = await prisma.connection.findMany({
      where: {
        receiverId: req.user.id,
        status: CONNECTION_STATUS.PENDING,
      },
      include: {
        requester: { select: basicUserSelect },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ requests });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  removeConnection,
  getMyConnections,
  getIncomingRequests,
};
