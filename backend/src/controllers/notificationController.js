const prisma = require('../utils/prisma');

const senderSelect = {
  id: true,
  name: true,
  profilePicture: true,
};

const getNotifications = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { recipientId: req.user.id },
        include: { sender: { select: senderSelect } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { recipientId: req.user.id } }),
      prisma.notification.count({ where: { recipientId: req.user.id, read: false } }),
    ]);

    res.status(200).json({
      notifications,
      unreadCount,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notificationId = parseInt(req.params.id, 10);
    if (Number.isNaN(notificationId)) {
      return res.status(400).json({ message: 'Invalid notification id' });
    }

    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    if (notification.recipientId !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own notifications' });
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    res.status(200).json({ notification: updated });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { recipientId: req.user.id, read: false },
      data: { read: true },
    });

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };
