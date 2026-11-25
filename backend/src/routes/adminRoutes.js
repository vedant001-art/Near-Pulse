const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAllAmenities,
  updateListingApproval,
  getAllUsers,
  toggleUserStatus,
  getAllReviews,
  deleteReview,
  triggerRenewalJob
} = require('../controllers/adminController');
const { authenticate, authorizeRole } = require('../middleware/authMiddleware');

router.use(authenticate, authorizeRole('ADMIN'));

router.get('/stats', getAdminStats);
router.get('/amenities', getAllAmenities);
router.patch('/amenities/:id/approval', updateListingApproval);
router.get('/users', getAllUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.get('/reviews', getAllReviews);
router.delete('/reviews/:id', deleteReview);
router.post('/trigger-renewal-reminders', triggerRenewalJob);

module.exports = router;
