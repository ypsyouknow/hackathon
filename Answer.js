const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Please provide content for your answer'],
  },
  question: {
    type: mongoose.Schema.ObjectId,
    ref: 'Question',
    required: true,
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
  isFeatured: {
    type: Boolean,
    default: false,
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

// Update updatedAt field before saving
answerSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Update question's answersCount and user's answersCount when an answer is saved
answerSchema.post('save', async function (doc) {
  await this.model('Question').updateOne(
    { _id: doc.question },
    { $inc: { answersCount: 1 } }
  );
  
  await this.model('User').updateOne(
    { _id: doc.author },
    { $inc: { answersCount: 1, reputation: 5 } }
  );
});

const Answer = mongoose.model('Answer', answerSchema);

module.exports = Answer;