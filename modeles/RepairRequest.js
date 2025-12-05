const mongoose = require('mongoose');

const repairRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  deviceType: {
    type: String,
    required: true,
    enum: ['laptop', 'desktop', 'tablet', 'printer', 'monitor', 'webcam', 'headset', 'projector', 'other']
  },
  brand: {
    type: String,
    required: true
  },
  model: {
    type: String
  },
  issueCategory: {
    type: String,
    required: true,
    enum: ['hardware', 'software', 'performance', 'connectivity', 'display', 'audio', 'power', 'other']
  },
  symptoms: [{
    type: String,
    required: true
  }],
  description: {
    type: String,
    required: true,
    maxLength: 1000
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'closed'],
    default: 'pending'
  },
  solutions: [{
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    solution: String,
    helpful: Boolean,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  preferredSolution: {
    type: String,
    enum: ['diy', 'professional', 'replace', 'any']
  },
  estimatedCost: {
    min: Number,
    max: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('RepairRequest', repairRequestSchema);