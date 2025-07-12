const express = require('express');
const questionController = require('../controllers/questionController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(questionController.getAllQuestions)
  .post(authController.protect, questionController.createQuestion);

router
  .route('/:id')
  .get(questionController.getQuestion)
  .patch(authController.protect, questionController.updateQuestion)
  .delete(authController.protect, questionController.deleteQuestion);

router
  .route('/:id/upvote')
  .put(authController.protect, questionController.upvoteQuestion);

router
  .route('/:id/downvote')
  .put(authController.protect, questionController.downvoteQuestion);

router
  .route('/:id/answers')
  .get(questionController.getQuestionAnswers);

router.get('/search', questionController.searchQuestions);
router.get('/trending', questionController.getTrendingQuestions);

module.exports = router;