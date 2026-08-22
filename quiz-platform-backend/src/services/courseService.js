const courseRepository = require('../repositories/courseRepository');
const AppError = require('../utils/AppError');

async function listCourses(user) {
  if (user.role === 'TEACHER') {
    return courseRepository.findMany({ teacherId: user.id });
  }
  // ADMIN và STUDENT thấy toàn bộ khóa học (STUDENT cần thấy để biết mà đăng ký/tham gia)
  return courseRepository.findMany();
}

async function getCourseById(id) {
  const course = await courseRepository.findById(id);
  if (!course) {
    throw new AppError('Không tìm thấy khóa học', null, 404);
  }
  return course;
}

async function createCourse({ title, description }, user) {
  return courseRepository.create({ title, description, teacherId: user.id });
}

async function updateCourse(id, data) {
  await getCourseById(id); // ném 404 nếu không tồn tại, trước khi update
  return courseRepository.update(id, data);
}

async function deleteCourse(id) {
  await getCourseById(id);
  return courseRepository.remove(id);
}

module.exports = { listCourses, getCourseById, createCourse, updateCourse, deleteCourse };