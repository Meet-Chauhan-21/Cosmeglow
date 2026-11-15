const Review = require('../models/review.model');
const Product = require('../models/product.model');

/**
 * GET /api/products/:id/reviews
 * Public – fetch all reviews for a product with aggregated stats
 */
const getProductReviews = async (req, res) => {
  try {
    const { id: productId } = req.params;

    const reviews = await Review.find({ productId }).sort({ createdAt: -1 });

    const totalReviews = reviews.length;

    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let ratingSum = 0;

    reviews.forEach((r) => {
      ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1;
      ratingSum += r.rating;
    });

    const averageRating = totalReviews > 0 ? +(ratingSum / totalReviews).toFixed(1) : 0;

    return res.status(200).json({
      success: true,
      reviews,
      averageRating,
      totalReviews,
      ratingCounts
    });
  } catch (error) {
    console.error('getProductReviews error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
};

/**
 * POST /api/products/:id/reviews
 * Protected (verifyJWT) – create a review; each user may review a product once
 */
const createReview = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { _id: userId, name: userName } = req.user;
    const { rating, title, content, images } = req.body;

    // Validate rating presence
    if (!rating) {
      return res.status(400).json({ success: false, message: 'Rating is required' });
    }

    // Check product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Prevent duplicate reviews
    const existing = await Review.findOne({ productId, userId });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this product' });
    }

    // Create the review
    const review = await Review.create({
      productId,
      userId,
      userName,
      rating,
      title: title || '',
      content: content || '',
      images: images || []
    });

    // Recompute product rating & reviewsCount from DB aggregation
    const agg = await Review.aggregate([
      { $match: { productId: product._id } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    if (agg.length > 0) {
      product.rating = +agg[0].avg.toFixed(1);
      product.reviewsCount = agg[0].count;
      await product.save();
    }

    return res.status(201).json({ success: true, message: 'Review submitted successfully', review });
  } catch (error) {
    console.error('createReview error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this product' });
    }
    return res.status(500).json({ success: false, message: 'Failed to submit review' });
  }
};

/**
 * DELETE /api/products/:id/reviews/:reviewId
 * Protected (verifyJWT) – admin OR review owner may delete
 */
const deleteReview = async (req, res) => {
  try {
    const { id: productId, reviewId } = req.params;
    const { _id: userId, role } = req.user;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Authorise: admin or the review's author
    const isOwner = review.userId.toString() === userId.toString();
    const isAdmin = role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorised to delete this review' });
    }

    await review.deleteOne();

    // Recompute product rating & reviewsCount
    const product = await Product.findById(productId);
    if (product) {
      const agg = await Review.aggregate([
        { $match: { productId: product._id } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
      ]);

      if (agg.length > 0) {
        product.rating = +agg[0].avg.toFixed(1);
        product.reviewsCount = agg[0].count;
      } else {
        product.rating = 0;
        product.reviewsCount = 0;
      }
      await product.save();
    }

    return res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('deleteReview error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete review' });
  }
};

/**
 * GET /api/products/reviews/recent
 * Public – fetch recent real customer reviews for Home page Testimonials
 */
const getRecentReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('productId', 'name image category')
      .sort({ createdAt: -1 })
      .limit(12);

    return res.status(200).json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error('getRecentReviews error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch recent reviews' });
  }
};

module.exports = { getProductReviews, createReview, deleteReview, getRecentReviews };
