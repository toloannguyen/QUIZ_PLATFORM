const express = require('express');
const submissionController = require('../controllers/submissionController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Tất cả thao tác thi cử phải đăng nhập và có role STUDENT
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('STUDENT'));

// POST /api/v1/submissions/exam/:examId/start
router.post('/exam/:examId/start', submissionController.startExam);

// POST /api/v1/submissions/exam/:examId/submit
router.post('/exam/:examId/submit', submissionController.submitExam);

module.exports = router;