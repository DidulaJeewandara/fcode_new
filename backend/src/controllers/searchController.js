const prisma = require('../utils/prisma');

const searchUsers = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const skip = (page - 1) * limit;

    if (!q) {
      return res.status(200).json({ users: [], page, limit, total: 0, totalPages: 0 });
    }

    const where = {
      id: { not: req.user.id },
      OR: [
        { name: { contains: q } },
        { headline: { contains: q } },
        { skills: { some: { name: { contains: q } } } },
      ],
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          headline: true,
          location: true,
          profilePicture: true,
          skills: { select: { id: true, name: true } },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    res.status(200).json({
      users,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { searchUsers };
