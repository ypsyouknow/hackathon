const Question = require('../models/Question');
const Answer = require('../models/Answer');
const User = require('../models/User');
const Topic = require('../models/Topic');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// @desc    Get all questions
// @route   GET /api/questions
// @access  Public
exports.getAllQuestions = catchAsync(async (req, res, next) => {
  // Filtering
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(el => delete queryObj[el]);

  // Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

  let query = Question.find(JSON.parse(queryStr)).populate({
    path: 'author',
    select: 'name photo jobTitle company',
  });

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  // Execute query
  const questions = await query;

  res.status(200).json({
    status: 'success',
    results: questions.length,
    data: {
      questions,
    },
  });
});

// @desc    Get a single question
// @route   GET /api/questions/:id
// @access  Public
exports.getQuestion = catchAsync(async (req, res, next) => {
  const question = await Question.findById(req.params.id)
    .populate({
      path: 'author',
      select: 'name photo jobTitle company',
    })
    .populate('topics');

  if (!question) {
    return next(new AppError('No question found with that ID', 404));
  }

  // Increment views
  question.views += 1;
  await question.save();

  res.status(200).json({
    status: 'success',
    data: {
      question,
    },
  });
});

// @desc    Create a question
// @route   POST /api/questions
// @access  Private
exports.createQuestion = catchAsync(async (req, res, next) => {
  // Add user to req.body
  req.body.author = req.user.id;

  // Process topics
  if (req.body.topics) {
    const topicNames = req.body.topics.split(',').map(topic => topic.trim());
    const topicIds = [];

    for (const name of topicNames) {
      let topic = await Topic.findOne({ name });

      if (!topic) {
        topic = await Topic.create({ name });
      }

      topicIds.push(topic._id);
    }

    req.body.topics = topicIds;
  }

  const question = await Question.create(req.body);

  // Update topics' questionsCount
  await Topic.updateMany(
    { _id: { $in: question.topics } },
    { $inc: { questionsCount: 1 } }
  );

  res.status(201).json({
    status: 'success',
    data: {
      question,
    },
  });
});

// @desc    Update a question
// @route   PATCH /api/questions/:id
// @access  Private
exports.updateQuestion = catchAsync(async (req, res, next) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    return next(new AppError('No question found with that ID', 404));
  }

  // Check if user is question author
  if (question.author.toString() !== req.user.id) {
    return next(
      new AppError('You are not authorized to update this question', 401)
    );
  }

  // Process topics if they are being updated
  if (req.body.topics) {
    const topicNames = req.body.topics.split(',').map(topic => topic.trim());
    const topicIds = [];

    for (const name of topicNames) {
      let topic = await Topic.findOne({ name });

      if (!topic) {
        topic = await Topic.create({ name });
      }

      topicIds.push(topic._id);
    }

    req.body.topics = topicIds;
  }

  const updatedQuestion = await Question.findByIdAndUpdate(
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
      question: updatedQuestion,
    },
  });
});

// @desc    Delete a question
// @route   DELETE /api/questions/:id
// @access  Private
exports.deleteQuestion = catchAsync(async (req, res, next) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    return next(new AppError('No question found with that ID', 404));
  }

  // Check if user is question author
  if (question.author.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new AppError('You are not authorized to delete this question', 401)
    );
  }

  await question.remove();

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// @desc    Upvote a question
// @route   PUT /api/questions/:id/upvote
// @access  Private
exports.upvoteQuestion = catchAsync(async (req, res, next) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    return next(new AppError('No question found with that ID', 404));
  }

  // Check if user has already upvoted
  if (
    question.upvotes.some(
      upvote => upvote.toString() === req.user.id.toString()
    )
  ) {
    return next(new AppError('Question already upvoted', 400));
  }

  // Remove downvote if exists
  question.downvotes = question.downvotes.filter(
    downvote => downvote.toString() !== req.user.id.toString()
  );

  question.upvotes.push(req.user.id);
  await question.save();

  // Update author's reputation
  await User.findByIdAndUpdate(question.author, {
    $inc: { reputation: 10 },
  });

  res.status(200).json({
    status: 'success',
    data: {
      question,
    },
  });
});

// @desc    Downvote a question
// @route   PUT /api/questions/:id/downvote
// @access  Private
exports.downvoteQuestion = catchAsync(async (req, res, next) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    return next(new AppError('No question found with that ID', 404));
  }

  // Check if user has already downvoted
  if (
    question.downvotes.some(
      downvote => downvote.toString() === req.user.id.toString()
    )
  ) {
    return next(new AppError('Question already downvoted', 400));
  }

  // Remove upvote if exists
  question.upvotes = question.upvotes.filter(
    upvote => upvote.toString() !== req.user.id.toString()
  );

  question.downvotes.push(req.user.id);
  await question.save();

  // Update author's reputation
  await User.findByIdAndUpdate(question.author, {
    $inc: { reputation: -2 },
  });

  res.status(200).json({
    status: 'success',
    data: {
      question,
    },
  });
});

// @desc    Get answers for a question
// @route   GET /api/questions/:id/answers
// @access  Public
exports.getQuestionAnswers = catchAsync(async (req, res, next) => {
  const answers = await Answer.find({ question: req.params.id })
    .populate({
      path: 'author',
      select: 'name photo jobTitle company',
    })
    .sort('-isFeatured -upvotes');

  res.status(200).json({
    status: 'success',
    results: answers.length,
    data: {
      answers,
    },
  });
});

// @desc    Search questions
// @route   GET /api/questions/search
// @access  Public
exports.searchQuestions = catchAsync(async (req, res, next) => {
  const { q } = req.query;

  if (!q) {
    return next(new AppError('Please provide a search query', 400));
  }

  const questions = await Question.find(
    { $text: { $search: q } },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(10);

  res.status(200).json({
    status: 'success',
    results: questions.length,
    data: {
      questions,
    },
  });
});

// @desc    Get trending questions
// @route   GET /api/questions/trending
// @access  Public
exports.getTrendingQuestions = catchAsync(async (req, res, next) => {
  const questions = await Question.find()
    .sort('-views -upvotes -answersCount')
    .limit(10)
    .populate({
      path: 'author',
      select: 'name photo jobTitle company',
    });

  res.status(200).json({
    status: 'success',
    results: questions.length,
    data: {
      questions,
    },
  });
});