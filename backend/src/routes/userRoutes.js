const express = require('express');
const {
  listUsers,
  getUserProfile,
  updateMyProfile,
  uploadProfilePicture: handleProfilePictureUpload,
  getConnectionStatus,
} = require('../controllers/userController');
const { addSkill, deleteSkill } = require('../controllers/skillController');
const { addEducation, deleteEducation } = require('../controllers/educationController');
const { addExperience, deleteExperience } = require('../controllers/experienceController');
const { followUser, unfollowUser, getFollowers, getFollowing } = require('../controllers/followController');
const { searchUsers } = require('../controllers/searchController');
const authMiddleware = require('../middleware/auth');
const { uploadProfilePicture } = require('../middleware/upload');

const router = express.Router();

router.use(authMiddleware);

router.get('/', listUsers);
router.get('/search', searchUsers);

router.put('/me', updateMyProfile);
router.post('/me/profile-picture', uploadProfilePicture.single('profilePicture'), handleProfilePictureUpload);

router.post('/me/skills', addSkill);
router.delete('/me/skills/:skillId', deleteSkill);

router.post('/me/education', addEducation);
router.delete('/me/education/:educationId', deleteEducation);

router.post('/me/experience', addExperience);
router.delete('/me/experience/:experienceId', deleteExperience);

router.get('/:userId/connection-status', getConnectionStatus);
router.post('/:userId/follow', followUser);
router.delete('/:userId/follow', unfollowUser);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);

// Generic single-segment profile lookup — must stay last so it doesn't
// shadow the more specific routes above (e.g. /search, /:userId/follow).
router.get('/:id', getUserProfile);

module.exports = router;
