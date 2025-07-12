const express = require('express');
const answerController = require('../controllers/answerController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(answerController.getAllAnswers)
  .post(authController.protect, answerController.createAnswer);

router
  .route('/:id')
  .get(answerController.getAnswer)
  .patch(authController.protect, answerController.updateAnswer)
  .delete(authController.protect, answerController.deleteAnswer);

router
  .route('/:id/upvote')
  .put(authController.protect, answerController.upvoteAnswer);

router
  .route('/:id/downvote')
  .put(authController.protect, answerController.downvoteAnswer);

router
  .route('/:id/feature')
  .put(authController.protect, answerController.featureAnswer);

module.exports = router;