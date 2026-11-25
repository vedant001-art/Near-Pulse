const express = require('express');
const router = express.Router();
const {
  getAmenities,
  getAmenityById,
  createAmenity,
  updateAmenity,
  deleteAmenity,
  toggleSaveAmenity,
  getSavedAmenities
} = require('../controllers/amenityController');
const { getAmenityReviews, createReview } = require('../controllers/reviewController');
const { authenticate, optionalAuth, authorizeRole } = require('../middleware/authMiddleware');

// Public or optional auth routes
router.get('/', optionalAuth, getAmenities);
router.get('/saved', authenticate, getSavedAmenities);
router.get('/:id', optionalAuth, getAmenityById);
router.get('/:id/reviews', getAmenityReviews);

// Protected routes
router.post('/:id/save', authenticate, toggleSaveAmenity);
router.post('/:id/reviews', authenticate, createReview);

// Provider and Admin routes
router.post('/', authenticate, authorizeRole('SERVICE_PROVIDER', 'ADMIN'), createAmenity);
router.put('/:id', authenticate, authorizeRole('SERVICE_PROVIDER', 'ADMIN'), updateAmenity);
router.delete('/:id', authenticate, authorizeRole('SERVICE_PROVIDER', 'ADMIN'), deleteAmenity);

module.exports = router;
