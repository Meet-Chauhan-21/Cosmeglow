const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
} = require('../controller/product.controller');
const { getProductReviews, createReview, deleteReview, getRecentReviews } = require('../controller/review.controller');
const { verifyJWT } = require('../middleware/auth.middleware');

// Public routes
router.get('/reviews/recent', getRecentReviews);
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Review routes
router.get('/:id/reviews', getProductReviews);                              // public
router.post('/:id/reviews', verifyJWT, createReview);                      // auth required
router.delete('/:id/reviews/:reviewId', verifyJWT, deleteReview);          // auth required (owner or admin)

module.exports = router;
