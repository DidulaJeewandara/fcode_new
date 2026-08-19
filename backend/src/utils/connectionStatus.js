const prisma = require('./prisma');

const CONNECTION_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
};

const findConnectionBetween = (userAId, userBId) => {
  return prisma.connection.findFirst({
    where: {
      OR: [
        { requesterId: userAId, receiverId: userBId },
        { requesterId: userBId, receiverId: userAId },
      ],
    },
  });
};

module.exports = { CONNECTION_STATUS, findConnectionBetween };
