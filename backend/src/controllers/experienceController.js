const prisma = require('../utils/prisma');

const addExperience = async (req, res, next) => {
  try {
    const { title, company, description, startDate, endDate } = req.body;
    if (!title || !title.trim() || !company || !company.trim()) {
      return res.status(400).json({ message: 'Title and company are required' });
    }

    const experience = await prisma.experience.create({
      data: {
        title: title.trim(),
        company: company.trim(),
        description: description || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        userId: req.user.id,
      },
    });

    res.status(201).json({ experience });
  } catch (error) {
    next(error);
  }
};

const deleteExperience = async (req, res, next) => {
  try {
    const experienceId = parseInt(req.params.experienceId, 10);
    if (Number.isNaN(experienceId)) {
      return res.status(400).json({ message: 'Invalid experience id' });
    }

    const experience = await prisma.experience.findUnique({ where: { id: experienceId } });
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }
    if (experience.userId !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own experience entries' });
    }

    await prisma.experience.delete({ where: { id: experienceId } });
    res.status(200).json({ message: 'Experience deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { addExperience, deleteExperience };
