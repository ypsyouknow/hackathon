const Topic = require('../models/Topic');
const Question = require('../models/Question');
const User = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// @desc    Get all topics
// @route   GET /api/topics
// @access  Public
exports.getAllTopics = catchAsync(async (req, res, next) => {
  const topics = await Topic.find().sort('-followers -questionsCount');

  res.status(200).json({
    status: 'success',
    results: topics.length,
    data: {
      topics,
    },
  });
});

// @desc    Get a single topic
// @route   GET /api/topics/:id
// @access  Public
exports.getTopic = catchAsync(async (req, res, next) => {
  const topic = await Topic.findById(req.params.id);

  if (!topic) {
    return next(new AppError('No topic found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      topic,
    },
  });
});

// @desc    Create a topic (admin only)
// @route   POST /api/topics
// @access  Private/Admin
exports.createTopic = catchAsync(async (req, res, next) => {
  const { name, description, icon } = req.body;

  // Check if topic already exists
  const existingTopic = await Topic.findOne({ name });
  if (existingTopic) {
    return next(new AppError('Topic already exists', 400));
  }

  const topic = await Topic.create({
    name,
    description,
    icon,
  });

  res.status(201).json({
    status: 'success',
    data: {
      topic,
    },
  });
});

// @desc    Update a topic (admin only)
// @route   PATCH /api/topics/:id
// @access  Private/Admin
exports.updateTopic = catchAsync(async (req, res, next) => {
  const topic = await Topic.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!topic) {
    return next(new AppError('No topic found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      topic,
    },
  });
});

// @desc    Delete a topic (admin only)
// @route   DELETE /api/topics/:id
// @access  Private/Admin
exports.deleteTopic = catchAsync(async (req, res, next) => {
  const topic = await Topic.findByIdAndDelete(req.params.id);

  if (!topic) {
    return next(new AppError('No topic found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// @desc    Get questions for a topic
// @route   GET /api/topics/:id/questions
// @access  Public
exports.getTopicQuestions = catchAsync(async (req, res, next) => {
  const questions = await Question.find({ topics: req.params.id })
    .populate('author', 'name photo')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: questions.length,
    data: {
      questions,
    },
  });
});

// @desc    Get followers for a topic
// @route   GET /api/topics/:id/followers
// @access  Public
exports.getTopicFollowers = catchAsync(async (req, res, next) => {
  const topic = await Topic.findById(req.params.id).populate(
    'followers',
    'name photo jobTitle company'
  );

  if (!topic) {
    return next(new AppError('No topic found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    results: topic.followers.length,
    data: {
      followers: topic.followers,
    },
  });
});

// @desc    Get trending topics
// @route   GET /api/topics/trending
// @access  Public
exports.getTrendingTopics = catchAsync(async (req, res, next) => {
  const topics = await Topic.find()
    .sort('-followers -questionsCount')
    .limit(10);

  res.status(200).json({
    status: 'success',
    results: topics.length,
    data: {
      topics,
    },
  });
});