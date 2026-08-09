const express = require('express');
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Tất cả các route bên dưới đều phải có token (phải đăng nhập)
router.use(authMiddleware.protect);

// Route GET: Ai cũng xem được (Student, Teacher)
// Route POST: Chỉ TEACHER mới tạo được khóa học
router
  .route('/')
  .get(courseController.getAllCourses)
  .post(authMiddleware.restrictTo('TEACHER'), courseController.createCourse);

// Route POST: Chỉ TEACHER mới thêm được bài giảng
router
  .route('/:courseId/lectures')
  .post(authMiddleware.restrictTo('TEACHER'), courseController.createLecture);

module.exports = router;