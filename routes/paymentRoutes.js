const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.post('/', authenticate, requireRole('student', 'admin'), paymentController.addPayment);
router.get('/', authenticate, requireRole('student', 'admin'), paymentController.getPayments);

module.exports = router;
