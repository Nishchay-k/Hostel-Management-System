const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.post('/', authenticate, requireRole('student', 'admin'), complaintController.addComplaint);
router.get('/', authenticate, requireRole('student', 'admin'), complaintController.getComplaints);
router.put('/:id', authenticate, requireRole('admin'), complaintController.updateComplaintStatus);

module.exports = router;
