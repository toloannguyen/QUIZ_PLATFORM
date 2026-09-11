const prisma = require('../utils/prismaClient');

// ===== GIỮ NGUYÊN 100% — không đổi gì, submissionService.submitExam() đang phụ thuộc =====

async function createSubmission(examId, studentId) {
  return prisma.submission.create({
    data: {
      examId,
      studentId,
      status: 'PENDING',
      startedAt: new Date()
    }
  });
}

async function createSubmissionAnswer(data) {
  return prisma.submissionAnswer.create({ data });
}

async function updateSubmissionStatus(submissionId, status, autoScore) {
  return prisma.submission.update({
    where: { id: submissionId },
    data: { status, autoScore }
  });
}

async function getSubmissionWithAnswers(submissionId) {
  return prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      answers: {
        include: { question: true }
      }
    }
  });
}

// ===== MỚI — luồng Review giáo viên =====

async function updateSubmissionAnswerReview(answerId, { teacherScore, teacherFeedback }) {
  return prisma.submissionAnswer.update({
    where: { id: Number(answerId) },
    data: { teacherScore, teacherFeedback },
  });
}

/**
 * `data` truyền linh hoạt (chỉ những field cần cập nhật) — Prisma tự bỏ qua field `undefined`,
 * nên gọi updateSubmissionReview(id, { finalScore, status }) mà không có teacherScore vẫn an toàn.
 */
async function updateSubmissionReview(submissionId, data) {
  return prisma.submission.update({
    where: { id: Number(submissionId) },
    data,
  });
}

/**
 * Submission không có teacherId trực tiếp — suy ra qua Submission -> Exam -> teacherId.
 * Dùng cho requireOwner middleware (chỉ giáo viên sở hữu đề mới được review bài nộp).
 */
async function getSubmissionOwnerId(id) {
  const submission = await prisma.submission.findUnique({
    where: { id: Number(id) },
    select: { exam: { select: { teacherId: true } } },
  });
  return submission ? submission.exam.teacherId : null;
}

/**
 * Danh sách submission cần review — lọc theo examId/status. Nếu truyền teacherId,
 * chỉ trả submission thuộc đề của đúng giáo viên đó (qua exam.teacherId).
 */
async function listSubmissions({ examId, status, teacherId } = {}) {
  const where = {};
  if (examId) where.examId = Number(examId);
  if (status) where.status = status;
  if (teacherId) where.exam = { teacherId: Number(teacherId) };

  return prisma.submission.findMany({
    where,
    include: {
      student: { select: { id: true, name: true, email: true } },
      exam: { select: { id: true, title: true } },
    },
    orderBy: { submittedAt: 'desc' },
  });
}

async function listSubmissionsByStudent(studentId) {
  return prisma.submission.findMany({
    where: { studentId: Number(studentId) },
    include: {
      exam: { select: { id: true, title: true } },
    },
    orderBy: { submittedAt: 'desc' },
  });
}

module.exports = {
  // Giữ nguyên
  createSubmission,
  createSubmissionAnswer,
  updateSubmissionStatus,
  getSubmissionWithAnswers,
  // Mới
  updateSubmissionAnswerReview,
  updateSubmissionReview,
  getSubmissionOwnerId,
  listSubmissions,
};