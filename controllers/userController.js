const User = require('../models/User');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Topic = require('../models/Topic');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select('-password -passwordChangedAt -passwordResetToken -passwordResetExpires')
    .populate('followingTopics', 'name');

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

// @desc    Get current user's profile
// @route   GET /api/users/me
// @access  Private
exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .select('-password -passwordChangedAt -passwordResetToken -passwordResetExpires')
    .populate('followingTopics', 'name');

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

// @desc    Update user profile
// @route   PATCH /api/users/updateMe
// @access  Private
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatePassword.',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = {
    name: req.body.name,
    email: req.body.email,
    bio: req.body.bio,
    company: req.body.company,
    jobTitle: req.body.jobTitle,
    photo: req.body.photo,
  };

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

// @desc    Delete user account
// @route   DELETE /api/users/deleteMe
// @access  Private
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// @desc    Follow a topic
// @route   POST /api/users/followTopic/:topicId
// @access  Private
exports.followTopic = catchAsync(async (req, res, next) => {
  const topic = await Topic.findById(req.params.topicId);

  if (!topic) {
    return next(new AppError('No topic found with that ID', 404));
  }

  // Check if user already follows the topic
  if (req.user.followingTopics.includes(req.params.topicId)) {
    return next(new AppError('You already follow this topic', 400));
  }

  // Add topic to user's following list
  await User.findByIdAndUpdate(req.user.id, {
    $addToSet: { followingTopics: req.params.topicId },
  });

  // Add user to topic's followers list
  await Topic.findByIdAndUpdate(req.params.topicId, {
    $addToSet: { followers: req.user.id },
  });

  res.status(200).json({
    status: 'success',
    message: 'Topic followed successfully',
  });
});

// @desc    Unfollow a topic
// @route   DELETE /api/users/unfollowTopic/:topicId
// @access  Private
exports.unfollowTopic = catchAsync(async (req, res, next) => {
  const topic = await Topic.findById(req.params.topicId);

  if (!topic) {
    return next(new AppError('No topic found with that ID', 404));
  }

  // Check if user follows the topic
  if (!req.user.followingTopics.includes(req.params.topicId)) {
    return next(new AppError('You do not follow this topic', 400));
  }

  // Remove topic from user's following list
  await User.findByIdAndUpdate(req.user.id, {
    $pull: { followingTopics: req.params.topicId },
  });

  // Remove user from topic's followers list
  await Topic.findByIdAndUpdate(req.params.topicId, {
    $pull: { followers: req.user.id },
  });

  res.status(200).json({
    status: 'success',
    message: 'Topic unfollowed successfully',
  });
});

// @desc    Follow a user
// @route   POST /api/users/follow/:userId
// @access  Private
exports.followUser = catchAsync(async (req, res, next) => {
  if (req.user.id === req.params.userId) {
    return next(new AppError('You cannot follow yourself', 400));
  }

  const userToFollow = await User.findById(req.params.userId);

  if (!userToFollow) {
    return next(new AppError('No user found with that ID', 404));
  }

  // Check if already following
  if (req.user.following.includes(req.params.userId)) {
    return next(new AppError('You already follow this user', 400));
  }

  // Add to current user's following list
  await User.findByIdAndUpdate(req.user.id, {
    $addToSet: { following: req.params.userId },
  });

  // Add to target user's followers list
  await User.findByIdAndUpdate(req.params.userId, {
    $addToSet: { followers: req.user.id },
  });

  res.status(200).json({
    status: 'success',
    message: 'User followed successfully',
  });
});

// @desc    Unfollow a user
// @route   DELETE /api/users/unfollow/:userId
// @access  Private
exports.unfollowUser = catchAsync(async (req, res, next) => {
  if (req.user.id === req.params.userId) {
    return next(new AppError('You cannot unfollow yourself', 400));
  }

  const userToUnfollow = await User.findById(req.params.userId);

  if (!userToUnfollow) {
    return next(new AppError('No user found with that ID', 404));
  }

  // Check if following
  if (!req.user.following.includes(req.params.userId)) {
    return next(new AppError('You do not follow this user', 400));
  }

  // Remove from current user's following list
  await User.findByIdAndUpdate(req.user.id, {
    $pull: { following: req.params.userId },
  });

  // Remove from target user's followers list
  await User.findByIdAndUpdate(req.params.userId, {
    $pull: { followers: req.user.id },
  });

  res.status(200).json({
    status: 'success',
    message: 'User unfollowed successfully',
  });
});

// @desc    Get user's questions
// @route   GET /api/users/:id/questions
// @access  Public
exports.getUserQuestions = catchAsync(async (req, res, next) => {
  const questions = await Question.find({ author: req.params.id })
    .populate('topics', 'name')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: questions.length,
    data: {
      questions,
    },
  });
});

// @desc    Get user's answers
// @route   GET /api/users/:id/answers
// @access  Public
exports.getUserAnswers = catchAsync(async (req, res, next) => {
  const answers = await Answer.find({ author: req.params.id })
    .populate('question', 'title')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: answers.length,
    data: {
      answers,
    },
  });
});

// @desc    Get user's followed topics
// @route   GET /api/users/:id/topics
// @access  Public
exports.getUserTopics = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate('followingTopics');

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    results: user.followingTopics.length,
    data: {
      topics: user.followingTopics,
    },
  });
});

// @desc    Get all users (for admin)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find()
    .select('-password -passwordChangedAt -passwordResetToken -passwordResetExpires')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

// @desc    Delete user (for admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});