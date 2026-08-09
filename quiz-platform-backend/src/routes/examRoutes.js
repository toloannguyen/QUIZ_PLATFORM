const express = require('express');
const examController = require('../controllers/examController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Bắt buộc đăng nhập
router.use(authMiddleware.protect);

// 1. Tuyến đường chung: Ai đăng nhập cũng xem được đề thi (Sinh viên & Giáo viên)
router.get('/:id', examController.getExam);

router.use(authMiddleware.restrictTo('TEACHER'));

// 2. Tuyến đường quản trị: Từ đây trở xuống CHỈ Giáo viên mới được đi qua
router.post('/', examController.createExam);
router.post('/:examId/questions', examController.createQuestion);

module.exports = router;