const courseRepository = require('../repositories/courseRepository');
const AppError = require('../utils/AppError');

async function listCourses(user) {
  if (user.role === 'TEACHER') {
    return courseRepository.findMany({ teacherId: user.id });
  }

  if (user.role === 'STUDENT') {
    return courseRepository.findMany({ studentId: user.id });
  }

  // ADMIN thấy toàn bộ khóa học
  return courseRepository.findMany();
}

async function getCourseById(id, user = null) {
  const course = await courseRepository.findById(id);
  if (!course) {
    throw new AppError('Không tìm thấy khóa học', null, 404);
  }

  if (user && user.role === 'STUDENT') {
    const enrolled = await courseRepository.findMany({ studentId: user.id, teacherId: undefined });
    const hasAccess = enrolled.some((item) => item.id === Number(id));
    if (!hasAccess) {
      throw new AppError('Bạn chưa đăng ký khóa học này', null, 403);
    }
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