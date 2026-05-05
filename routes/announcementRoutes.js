const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.get('/', authenticate, announcementController.getAnnouncements);
router.post('/', authenticate, requireRole('admin'), announcementController.createAnnouncement);
router.put('/:id/read', authenticate, requireRole('student'), announcementController.markAnnouncementRead);

module.exports = router;
