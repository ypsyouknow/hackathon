const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/me', authController.protect, userController.getMe);
router.patch('/updateMe', authController.protect, userController.updateMe);
router.delete('/deleteMe', authController.protect, userController.deleteMe);

router
  .route('/:id')
  .get(userController.getUser)
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    userController.deleteUser
  );

router
  .route('/:id/questions')
  .get(userController.getUserQuestions);

router
  .route('/:id/answers')
  .get(userController.getUserAnswers);

router
  .route('/:id/topics')
  .get(userController.getUserTopics);

router
  .post('/followTopic/:topicId', authController.protect, userController.followTopic)
  .delete('/unfollowTopic/:topicId', authController.protect, userController.unfollowTopic);

router
  .post('/follow/:userId', authController.protect, userController.followUser)
  .delete('/unfollow/:userId', authController.protect, userController.unfollowUser);

// Admin only routes
router.use(authController.protect, authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers);

module.exports = router;