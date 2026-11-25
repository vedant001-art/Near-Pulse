const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getProviderListings,
  getProviderSubscriptions,
  getProviderPayments,
  toggleListingAvailability,
  addPlanToAmenity,
  deletePlanFromAmenity
} = require('../controllers/providerController');
const { replyToReview } = require('../controllers/reviewController');
const { authenticate, authorizeRole } = require('../middleware/authMiddleware');

router.use(authenticate, authorizeRole('SERVICE_PROVIDER', 'ADMIN'));

router.get('/stats', getDashboardStats);
router.get('/listings', getProviderListings);
router.get('/subscriptions', getProviderSubscriptions);
router.get('/payments', getProviderPayments);
router.patch('/listings/:id/availability', toggleListingAvailability);
router.post('/listings/:id/plans', addPlanToAmenity);
router.delete('/plans/:planId', deletePlanFromAmenity);
router.post('/reviews/:reviewId/reply', replyToReview);

module.exports = router;
