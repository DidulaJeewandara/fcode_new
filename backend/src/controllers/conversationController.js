const prisma = require('../utils/prisma');

const basicUserSelect = {
  id: true,
  name: true,
  headline: true,
  profilePicture: true,
};

const assertParticipant = async (conversationId, userId) => {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { userId_conversationId: { userId, conversationId } },
  });
  return Boolean(participant);
};

const startConversation = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const otherUserId = parseInt(userId, 10);

    if (Number.isNaN(otherUserId)) {
      return res.status(400).json({ message: 'userId is required' });
    }
    if (otherUserId === req.user.id) {
      return res.status(400).json({ message: 'You cannot start a conversation with yourself' });
    }

    const otherUser = await prisma.user.findUnique({ where: { id: otherUserId } });
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const myConversations = await prisma.conversation.findMany({
      where: { participants: { some: { userId: req.user.id } } },
      include: { participants: true },
    });

    const existing = myConversations.find(
      (c) => c.participants.length === 2 && c.participants.some((p) => p.userId === otherUserId)
    );

    if (existing) {
      return res.status(200).json({ conversation: existing });
    }

    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: req.user.id }, { userId: otherUserId }],
        },
      },
      include: { participants: true },
    });

    res.status(201).json({ conversation });
  } catch (error) {
    next(error);
  }
};

const getMyConversations = async (req, res, next) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { userId: req.user.id } } },
      include: {
        participants: { include: { user: { select: basicUserSelect } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = conversations.map((c) => {
      const otherParticipant = c.participants.find((p) => p.userId !== req.user.id);
      return {
        id: c.id,
        otherUser: otherParticipant?.user || null,
        lastMessage: c.messages[0] || null,
        createdAt: c.createdAt,
      };
    });

    res.status(200).json({ conversations: result });
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const conversationId = parseInt(req.params.id, 10);
    if (Number.isNaN(conversationId)) {
      return res.status(400).json({ message: 'Invalid conversation id' });
    }

    const isParticipant = await assertParticipant(conversationId, req.user.id);
    if (!isParticipant) {
      return res.status(403).json({ message: 'You do not have access to this conversation' });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { sender: { select: basicUserSelect } },
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    res.status(200).json({
      messages: messages.reverse(),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const conversationId = parseInt(req.params.id, 10);
    if (Number.isNaN(conversationId)) {
      return res.status(400).json({ message: 'Invalid conversation id' });
    }

    const isParticipant = await assertParticipant(conversationId, req.user.id);
    if (!isParticipant) {
      return res.status(403).json({ message: 'You do not have access to this conversation' });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const message = await prisma.message.create({
      data: { content: content.trim(), senderId: req.user.id, conversationId },
      include: { sender: { select: basicUserSelect } },
    });

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
};

module.exports = { startConversation, getMyConversations, getMessages, sendMessage };
