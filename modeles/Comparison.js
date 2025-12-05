const mongoose = require('mongoose');

const comparisonSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  }],
  notes: {
    type: String,
    maxLength: 500
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isPublic: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Limit comparisons to max 5 products
comparisonSchema.pre('save', function(next) {
  if (this.products.length > 5) {
    next(new Error('Maximum 5 products can be compared at once'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Comparison', comparisonSchema);