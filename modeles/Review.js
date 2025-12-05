const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    maxLength: 100
  },
  comment: {
    type: String,
    required: true,
    maxLength: 1000
  },
  pros: [{
    type: String
  }],
  cons: [{
    type: String
  }],
  userType: {
    type: String,
    enum: ['student', 'teacher', 'director', 'administrator', 'parent', 'other'],
    required: false
  },
  role: {
    type: String,
    required: false
  },
  useCase: {
    type: String,
    enum: ['teaching-online', 'presentations', 'programming', 'graphic-design', 'video-editing',
           'research', 'writing', 'meetings', 'printing', 'homework', 'note-taking']
  },
  verified: {
    type: Boolean,
    default: false
  },
  helpful: {
    type: Number,
    default: 0
  },
  helpfulVotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  images: [{
    type: String
  }]
}, { timestamps: true });

// Prevent multiple reviews from same user for same product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

module.exports = mongoose.models.Review || mongoose.model('Review', reviewSchema);