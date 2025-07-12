const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for the topic'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  description: {
    type: String,
    trim: true,
  },
  icon: {
    type: String,
    default: 'fas fa-hashtag',
  },
  followers: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  ],
  questionsCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Update questionsCount when a question is added/removed from this topic
topicSchema.virtual('questions', {
  ref: 'Question',
  foreignField: 'topics',
  localField: '_id',
  count: true,
});

topicSchema.set('toJSON', { virtuals: true });
topicSchema.set('toObject', { virtuals: true });

const Topic = mongoose.model('Topic', topicSchema);

module.exports = Topic;