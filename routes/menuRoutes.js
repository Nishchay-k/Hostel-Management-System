const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.get('/', authenticate, requireRole('admin', 'student'), menuController.getMenu);

module.exports = router;
