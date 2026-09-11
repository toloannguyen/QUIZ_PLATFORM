const lectureRepository = require('../repositories/lectureRepository');
const courseRepository = require('../repositories/courseRepository');
const AppError = require('../utils/AppError');

async function listLectures(courseId) {
  if (!courseId) {
    throw new AppError('Thiếu tham số courseId', 'courseId', 400);
  }
  return lectureRepository.findByCourseId(courseId);
}

async function getLectureById(id) {
  const lecture = await lectureRepository.findById(id);
  if (!lecture) {
    throw new AppError('Không tìm thấy bài giảng', null, 404);
  }
  return lecture;
}

async function createLecture(data, user) {
  const course = await courseRepository.findById(data.courseId);
  if (!course) {
    throw new AppError('Khóa học không tồn tại', 'courseId', 404);
  }
  if (user.role !== 'ADMIN' && course.teacherId !== user.id) {
    throw new AppError('Bạn không phải chủ sở hữu khóa học này, không thể tạo bài giảng', 'courseId', 403);
  }
  return lectureRepository.create(data);
}

async function updateLecture(id, data) {
  await getLectureById(id);
  const { courseId, ...safeData } = data; // không cho đổi courseId
  return lectureRepository.update(id, safeData);
}

async function deleteLecture(id) {
  await getLectureById(id);
  return lectureRepository.remove(id);
}

module.exports = { listLectures, getLectureById, createLecture, updateLecture, deleteLecture };