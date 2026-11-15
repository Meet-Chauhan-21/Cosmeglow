const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    userName: {
      type: String,
      required: [true, 'User name is required'],
      trim: true
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    title: {
      type: String,
      trim: true,
      default: ''
    },
    content: {
      type: String,
      trim: true,
      default: ''
    },
    images: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Compound index to prevent duplicate reviews per user per product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
module.exports = Review;
