const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead
} = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', getUserNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);

module.exports = router;
