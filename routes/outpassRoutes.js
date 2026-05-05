const express = require('express');
const router = express.Router();
const outpassController = require('../controllers/outpassController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.post('/request', authenticate, requireRole('student', 'admin'), outpassController.requestOutpass);
router.put('/approve/:id', authenticate, requireRole('admin'), outpassController.approveOutpass);
router.put('/checkout/:id', authenticate, requireRole('admin'), outpassController.checkoutOutpass);
router.put('/checkin/:id', authenticate, requireRole('admin'), outpassController.checkinOutpass);
router.get('/currently-outside', authenticate, requireRole('admin'), outpassController.getCurrentlyOutside);

module.exports = router;
