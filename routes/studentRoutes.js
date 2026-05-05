const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.get('/me', authenticate, requireRole('student'), studentController.getMyProfile);
router.get('/me/room', authenticate, requireRole('student'), studentController.getMyRoom);
router.post('/', authenticate, requireRole('admin'), studentController.addStudent);
router.get('/', authenticate, requireRole('admin'), studentController.getAllStudents);
router.put('/:id', authenticate, requireRole('admin'), studentController.updateStudent);
router.delete('/:id', authenticate, requireRole('admin'), studentController.deleteStudent);

module.exports = router;
