const prisma = require('../utils/prisma');

const addEducation = async (req, res, next) => {
  try {
    const { school, degree, fieldOfStudy, startDate, endDate } = req.body;
    if (!school || !school.trim()) {
      return res.status(400).json({ message: 'School is required' });
    }

    const education = await prisma.education.create({
      data: {
        school: school.trim(),
        degree: degree || null,
        fieldOfStudy: fieldOfStudy || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        userId: req.user.id,
      },
    });

    res.status(201).json({ education });
  } catch (error) {
    next(error);
  }
};

const deleteEducation = async (req, res, next) => {
  try {
    const educationId = parseInt(req.params.educationId, 10);
    if (Number.isNaN(educationId)) {
      return res.status(400).json({ message: 'Invalid education id' });
    }

    const education = await prisma.education.findUnique({ where: { id: educationId } });
    if (!education) {
      return res.status(404).json({ message: 'Education not found' });
    }
    if (education.userId !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own education entries' });
    }

    await prisma.education.delete({ where: { id: educationId } });
    res.status(200).json({ message: 'Education deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { addEducation, deleteEducation };
