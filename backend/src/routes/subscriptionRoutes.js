const express = require('express');
const router = express.Router();
const {
  createSubscription,
  getUserSubscriptions,
  getSubscriptionById,
  cancelSubscription
} = require('../controllers/subscriptionController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.post('/', createSubscription);
router.get('/', getUserSubscriptions);
router.get('/:id', getSubscriptionById);
router.patch('/:id/cancel', cancelSubscription);

module.exports = router;
