const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for your question'],
    trim: true,
    maxlength: [200, 'Question title cannot be more than 200 characters'],
  },
  content: {
    type: String,
    required: [true, 'Please provide content for your question'],
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  topics: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Topic',
    },
  ],
  upvotes: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  ],
  downvotes: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  ],
  views: {
    type: Number,
    default: 0,
  },
  answersCount: {
    type: Number,
    default: 0,
  },
  isAnswered: {
    type: Boolean,
    default: false,
  },
  featuredAnswer: {
    type: mongoose.Schema.ObjectId,
    ref: 'Answer',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for better performance
questionSchema.index({ title: 'text', content: 'text' });
questionSchema.index({ author: 1 });
questionSchema.index({ topics: 1 });
questionSchema.index({ createdAt: -1 });
questionSchema.index({ upvotes: -1 });

// Update updatedAt field before saving
questionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Update user's questionsCount when a question is saved
questionSchema.post('save', async function (doc) {
  await this.model('User').updateOne(
    { _id: doc.author },
    { $inc: { questionsCount: 1 } }
  );
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;