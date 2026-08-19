const prisma = require('../utils/prisma');

const NOTIFICATION_TYPES = {
  CONNECTION_REQUEST: 'CONNECTION_REQUEST',
  CONNECTION_ACCEPTED: 'CONNECTION_ACCEPTED',
  POST_LIKE: 'POST_LIKE',
  POST_COMMENT: 'POST_COMMENT',
};

const createNotification = async ({ recipientId, senderId, type, message, relatedId }) => {
  if (recipientId === senderId) return null;

  return prisma.notification.create({
    data: { recipientId, senderId, type, message, relatedId },
  });
};

module.exports = { NOTIFICATION_TYPES, createNotification };
