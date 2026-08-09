const courseService = require('../services/courseService');
const catchAsync = require('../utils/catchAsync');

const createCourse = catchAsync(async (req, res, next) => {
  // Lấy req.user.id (ID của giáo viên đang đăng nhập) do authMiddleware truyền sang
  const teacherId = req.user.id; 
  const result = await courseService.createCourse(teacherId, req.body);

  res.status(201).json({
    status: 'success',
    data: { course: result },
  });
});

const getAllCourses = catchAsync(async (req, res, next) => {
  const result = await courseService.getAllCourses();

  res.status(200).json({
    status: 'success',
    results: result.length,
    data: { courses: result },
  });
});

const createLecture = catchAsync(async (req, res, next) => {
  const teacherId = req.user.id;
  // Lấy courseId từ trên thanh địa chỉ URL (ví dụ: /api/v1/courses/5/lectures)
  const courseId = parseInt(req.params.courseId, 10); 

  const result = await courseService.createLecture(teacherId, courseId, req.body);

  res.status(201).json({
    status: 'success',
    data: { lecture: result },
  });
});

module.exports = {
  createCourse,
  getAllCourses,
  createLecture,
};