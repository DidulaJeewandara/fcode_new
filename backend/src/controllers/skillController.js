const prisma = require('../utils/prisma');

const addSkill = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Skill name is required' });
    }

    const skill = await prisma.skill.create({
      data: { name: name.trim(), userId: req.user.id },
    });

    res.status(201).json({ skill });
  } catch (error) {
    next(error);
  }
};

const deleteSkill = async (req, res, next) => {
  try {
    const skillId = parseInt(req.params.skillId, 10);
    if (Number.isNaN(skillId)) {
      return res.status(400).json({ message: 'Invalid skill id' });
    }

    const skill = await prisma.skill.findUnique({ where: { id: skillId } });
    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }
    if (skill.userId !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own skills' });
    }

    await prisma.skill.delete({ where: { id: skillId } });
    res.status(200).json({ message: 'Skill deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { addSkill, deleteSkill };
