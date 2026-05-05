const express = require('express');
const router = express.Router();
const allocationController = require('../controllers/allocationController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.post('/', authenticate, requireRole('admin'), allocationController.allocateRoom);

module.exports = router;
