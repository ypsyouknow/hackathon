const express = require('express');
const topicController = require('../controllers/topicController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/', topicController.getAllTopics);
router.get('/trending', topicController.getTrendingTopics);

router
  .route('/:id')
  .get(topicController.getTopic)
  .patch(
    authController.protect,
    authController.restrictTo('admin'),
    topicController.updateTopic
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    topicController.deleteTopic
  );

router
  .route('/:id/questions')
  .get(topicController.getTopicQuestions);

router
  .route('/:id/followers')
  .get(topicController.getTopicFollowers);

// Admin only routes
router.use(authController.protect, authController.restrictTo('admin'));

router
  .route('/')
  .post(topicController.createTopic);

module.exports = router;