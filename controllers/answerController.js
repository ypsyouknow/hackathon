const Answer = require('../models/Answer');
const Question = require('../models/Question');
const User = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// @desc    Get all answers
// @route   GET /api/answers
// @access  Public
exports.getAllAnswers = catchAsync(async (req, res, next) => {
  const answers = await Answer.find().populate({
    path: 'author',
    select: 'name photo jobTitle company',
  });

  res.status(200).json({
    status: 'success',
    results: answers.length,
    data: {
      answers,
    },
  });
});

// @desc    Get a single answer
// @route   GET /api/answers/:id
// @access  Public
exports.getAnswer = catchAsync(async (req, res, next) => {
  const answer = await Answer.findById(req.params.id).populate({
    path: 'author',
    select: 'name photo jobTitle company',
  });

  if (!answer) {
    return next(new AppError('No answer found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      answer,
    },
  });
});

// @desc    Create an answer
// @route   POST /api/answers
// @access  Private
exports.createAnswer = catchAsync(async (req, res, next) => {
  // Add user to req.body
  req.body.author = req.user.id;

  // Check if question exists
  const question = await Question.findById(req.body.question);
  if (!question) {
    return next(new AppError('No question found with that ID', 404));
  }

  const answer = await Answer.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      answer,
    },
  });
});

// @desc    Update an answer
// @route   PATCH /api/answers/:id
// @access  Private
exports.updateAnswer = catchAsync(async (req, res, next) => {
  const answer = await Answer.findById(req.params.id);

  if (!answer) {
    return next(new AppError('No answer found with that ID', 404));
  }

  // Check if user is answer author
  if (answer.author.toString() !== req.user.id) {
    return next(
      new AppError('You are not authorized to update this answer', 401)
    );
  }

  const updatedAnswer = await Answer.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      answer: updatedAnswer,
    },
  });
});

// @desc    Delete an answer
// @route   DELETE /api/answers/:id
// @access  Private
exports.deleteAnswer = catchAsync(async (req, res, next) => {
  const answer = await Answer.findById(req.params.id);

  if (!answer) {
    return next(new AppError('No answer found with that ID', 404));
  }

  // Check if user is answer author
  if (answer.author.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new AppError('You are not authorized to delete this answer', 401)
    );
  }

  await answer.remove();

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// @desc    Upvote an answer
// @route   PUT /api/answers/:id/upvote
// @access  Private
exports.upvoteAnswer = catchAsync(async (req, res, next) => {
  const answer = await Answer.findById(req.params.id);

  if (!answer) {
    return next(new AppError('No answer found with that ID', 404));
  }

  // Check if user has already upvoted
  if (
    answer.upvotes.some(upvote => upvote.toString() === req.user.id.toString())
  ) {
    return next(new AppError('Answer already upvoted', 400));
  }

  // Remove downvote if exists
  answer.downvotes = answer.downvotes.filter(
    downvote => downvote.toString() !== req.user.id.toString()
  );

  answer.upvotes.push(req.user.id);
  await answer.save();

  // Update author's reputation
  await User.findByIdAndUpdate(answer.author, {
    $inc: { reputation: 15 },
  });

  res.status(200).json({
    status: 'success',
    data: {
      answer,
    },
  });
});

// @desc    Downvote an answer
// @route   PUT /api/answers/:id/downvote
// @access  Private
exports.downvoteAnswer = catchAsync(async (req, res, next) => {
  const answer = await Answer.findById(req.params.id);

  if (!answer) {
    return next(new AppError('No answer found with that ID', 404));
  }

  // Check if user has already downvoted
  if (
    answer.downvotes.some(
      downvote => downvote.toString() === req.user.id.toString()
    )
  ) {
    return next(new AppError('Answer already downvoted', 400));
  }

  // Remove upvote if exists
  answer.upvotes = answer.upvotes.filter(
    upvote => upvote.toString() !== req.user.id.toString()
  );

  answer.downvotes.push(req.user.id);
  await answer.save();

  // Update author's reputation
  await User.findByIdAndUpdate(answer.author, {
    $inc: { reputation: -5 },
  });

  res.status(200).json({
    status: 'success',
    data: {
      answer,
    },
  });
});

// @desc    Mark answer as featured
// @route   PUT /api/answers/:id/feature
// @access  Private
exports.featureAnswer = catchAsync(async (req, res, next) => {
  const answer = await Answer.findById(req.params.id).populate('question');

  if (!answer) {
    return next(new AppError('No answer found with that ID', 404));
  }

  // Check if user is question author
  if (
    answer.question.author.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new AppError('You are not authorized to feature this answer', 401)
    );
  }

  // Unfeature any other featured answer for this question
  await Answer.updateMany(
    { question: answer.question._id, _id: { $ne: answer._id } },
    { isFeatured: false }
  );

  answer.isFeatured = true;
  await answer.save();

  // Update question's featured answer
  await Question.findByIdAndUpdate(answer.question._id, {
    featuredAnswer: answer._id,
    isAnswered: true,
  });

  // Update answer author's reputation
  await User.findByIdAndUpdate(answer.author, {
    $inc: { reputation: 50 },
    $addToSet: { badges: 'featured-answer' },
  });

  res.status(200).json({
    status: 'success',
    data: {
      answer,
    },
  });
});