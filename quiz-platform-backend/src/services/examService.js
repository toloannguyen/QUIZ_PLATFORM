const examRepository = require('../repositories/examRepository');
const courseRepository = require('../repositories/courseRepository');
const AppError = require('../utils/AppError');

// ===== GIỮ NGUYÊN — không đổi gì các hàm đã có từ trước =====

async function listExams(user, filters = {}) {
  if (user.role === 'TEACHER') {
    return examRepository.findMany({ teacherId: user.id, courseId: filters.courseId });
  }

  if (user.role === 'STUDENT') {
    return examRepository.findMany({ studentId: user.id, courseId: filters.courseId });
  }

  return examRepository.findMany({ courseId: filters.courseId });
}

async function getExamById(id, user = null) {
  const exam = await examRepository.findById(id);
  if (!exam) {
    throw new AppError('Không tìm thấy đề thi', null, 404);
  }

  if (user && user.role === 'STUDENT') {
    const enrolledExams = await examRepository.findMany({ studentId: user.id });
    const hasAccess = enrolledExams.some((item) => item.id === Number(id));
    if (!hasAccess) {
      throw new AppError('Bạn chưa đăng ký khóa học chứa đề thi này', null, 403);
    }
  }

  return exam;
}

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
  await getExamById(id);
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

// ===== MỚI — luồng học sinh làm bài =====

/**
 * Lấy đề thi cho học sinh làm bài — đã ẩn correctAnswer/explanation/isCorrect
 * ngay từ tầng repository (Prisma select whitelist).
 *
 * Có kèm `isExpired` (tính toán, không lưu DB) để frontend tự quyết định có cho
 * nộp bài nữa hay không — logic chặn nộp bài THẬT SỰ (nếu cần) nên nằm ở
 * submissionService khi xử lý POST /submissions/submit, không chỉ dựa vào field này.
 */
async function getExamForTake(id, user = null) {
  const exam = await examRepository.findByIdWithQuestionsForStudent(id);
  if (!exam) {
    throw new AppError('Không tìm thấy đề thi', null, 404);
  }

  if (user && user.role === 'STUDENT') {
    const enrolledExams = await examRepository.findMany({ studentId: user.id });
    const hasAccess = enrolledExams.some((item) => item.id === Number(id));
    if (!hasAccess) {
      throw new AppError('Bạn chưa đăng ký khóa học chứa đề thi này', null, 403);
    }
  }

  return {
    ...exam,
    isExpired: new Date(exam.dueDate) < new Date(),
  };
}

module.exports = {
  listExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  getExamForTake,
};