const express = require('express');
const router = express.Router();
const { verifyPayment, getUserPayments } = require('../controllers/paymentController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/verify', authenticate, verifyPayment);
router.get('/history', authenticate, getUserPayments);

// Webhook simulation / endpoint
router.post('/webhook', (req, res) => {
  console.log('[Payment Webhook] Received webhook payload:', req.body);
  res.json({ status: 'ok' });
});

module.exports = router;
