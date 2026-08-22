const examRepository = require('../repositories/examRepository');
const courseRepository = require('../repositories/courseRepository');
const AppError = require('../utils/AppError');

async function listExams(user, filters = {}) {
  if (user.role === 'TEACHER') {
    return examRepository.findMany({ teacherId: user.id, courseId: filters.courseId });
  }
  // ADMIN/STUDENT thấy tất cả (lọc theo courseId nếu có truyền query)
  return examRepository.findMany({ courseId: filters.courseId });
}

async function getExamById(id) {
  const exam = await examRepository.findById(id);
  if (!exam) {
    throw new AppError('Không tìm thấy đề thi', null, 404);
  }
  return exam;
}

/**
 * Tạo Exam mới. Điểm quan trọng: courseId truyền vào phải thuộc đúng giáo viên
 * đang tạo — nếu không sẽ tạo được đề thi gắn vào khóa học của người khác.
 * requireOwner middleware KHÔNG bắt được lỗi này vì lúc tạo Exam chưa tồn tại,
 * nên phải tự check ở đây, dựa trên teacherId của Course.
 */
async function createExam(data, user) {
  const course = await courseRepository.findById(data.courseId);
  if (!course) {
    throw new AppError('Khóa học không tồn tại', 'courseId', 404);
  }
  if (user.role !== 'ADMIN' && course.teacherId !== user.id) {
    throw new AppError('Bạn không phải chủ sở hữu khóa học này, không thể tạo đề thi', 'courseId', 403);
  }

  return examRepository.create({
    title: data.title,
    description: data.description,
    duration: data.duration,
    dueDate: new Date(data.dueDate),
    courseId: Number(data.courseId),
    teacherId: user.id,
  });
}

async function updateExam(id, data) {
  await getExamById(id); // ném 404 nếu không tồn tại

  const payload = { ...data };
  if (payload.dueDate) {
    payload.dueDate = new Date(payload.dueDate);
  }
  return examRepository.update(id, payload);
}

async function deleteExam(id) {
  await getExamById(id);
  return examRepository.remove(id);
}

module.exports = { listExams, getExamById, createExam, updateExam, deleteExam };