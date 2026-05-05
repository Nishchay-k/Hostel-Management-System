const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.post('/', authenticate, requireRole('admin'), roomController.addRoom);
router.get('/', authenticate, requireRole('admin', 'student'), roomController.getRooms);

module.exports = router;
