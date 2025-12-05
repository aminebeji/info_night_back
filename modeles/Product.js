const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['laptop', 'desktop', 'tablet', 'tablets', 'printer', 'software', 'monitor', 'webcam', 'headset', 'projector', 'other']
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  brand: {
    type: String,
    required: false,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  features: [{
    type: String
  }],
  specifications: {
    type: Map,
    of: String
  },
  badges: [{
    type: String,
    enum: ['eco-friendly', 'best-value', 'top-rated', 'new-arrival', 'on-sale',
           'sustainable', 'durable', 'accessible', 'energy-efficient', 'student-discount',
           'bulk-pricing', 'warranty', 'local-support', 'cloud-enabled', 'portable']
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  systemRecommended: {
    type: Boolean,
    default: false
  },
  isSystemCreated: {
    type: Boolean,
    default: false
  },
  targetAudience: [{
    type: String,
    enum: ['student', 'teacher', 'director', 'administrator', 'parent']
  }],
  educationalUse: [{
    type: String
  }],
  accessibility: [{
    type: String
  }],
  useCase: [{
    type: String,
    enum: ['teaching-online', 'presentations', 'programming', 'graphic-design', 'video-editing',
           'research', 'writing', 'meetings', 'printing', 'homework', 'note-taking']
  }],
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approved: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Indexes for better search performance
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ systemRecommended: 1 });

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);