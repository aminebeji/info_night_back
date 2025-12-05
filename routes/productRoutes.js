const express = require('express');
const router = express.Router();
const productController = require('../controlleurs/productController');
const reviewController = require('../controlleurs/reviewController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Product routes
router.get('/', optionalAuth, productController.getProducts);
router.get('/search', optionalAuth, productController.searchProducts);
router.get('/recommendations', optionalAuth, productController.getRecommendations);

// Dashboard routes - must come before /:id route
router.get('/user/my-products', authenticate, productController.getUserProducts);
router.get('/user/my-reviews', authenticate, productController.getUserReviews);
router.get('/user/my-favorites', authenticate, productController.getUserFavorites);

router.get('/:id', optionalAuth, productController.getProduct);
router.post('/', authenticate, productController.createProduct);
router.put('/:id', authenticate, productController.updateProduct);
router.delete('/:id', authenticate, productController.deleteProduct);

// Review routes
router.get('/:productId/reviews', reviewController.getProductReviews);
router.post('/:productId/reviews', authenticate, reviewController.createReview);
router.put('/reviews/:id', authenticate, reviewController.updateReview);
router.delete('/reviews/:id', authenticate, reviewController.deleteReview);
router.post('/reviews/:id/helpful', authenticate, reviewController.markHelpful);

module.exports = router;