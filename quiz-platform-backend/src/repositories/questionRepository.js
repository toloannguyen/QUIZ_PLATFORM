const prisma = require('../utils/prismaClient');

// ===== GIỮ NGUYÊN 100% — KHÔNG ĐỔI GÌ, gradingService.js đang phụ thuộc getQuestionWithCourseInfo =====

async function createQuestion(data) {
  return prisma.question.create({ data });
}

async function getQuestionById(id) {
  return prisma.question.findUnique({
    where: { id },
    include: { options: true }
  });
}

async function getQuestionWithCourseInfo(id) {
  return prisma.question.findUnique({
    where: { id },
    include: {
      exam: {
        select: { courseId: true }
      }
    }
  });
}

async function getQuestionsByExamId(examId) {
  return prisma.question.findMany({
    where: { examId },
    include: { options: true },
    orderBy: { orderNumber: 'asc' }
  });
}

// ===== MỚI — đặt tên KHỚP với những gì routes/questionRoutes.js và
// services/questionOptionService.js đang gọi sẵn trên máy bạn, để không phải sửa 2 file đó =====

async function updateQuestion(id, data) {
  return prisma.question.update({
    where: { id: Number(id) },
    data,
    include: { options: true },
  });
}

async function deleteQuestion(id) {
  return prisma.question.delete({ where: { id: Number(id) } });
}

/**
 * routes/questionRoutes.js (đã có sẵn trên máy bạn) gọi đúng tên "getOwnerId"
 * cho cả check PATCH/DELETE /questions/:id lẫn POST /questions/:questionId/options.
 * Question không có teacherId trực tiếp — suy ra qua Question -> Exam -> teacherId.
 */
async function getOwnerId(id) {
  const question = await prisma.question.findUnique({
    where: { id: Number(id) },
    select: { exam: { select: { teacherId: true } } },
  });
  return question ? question.exam.teacherId : null;
}

async function getQuestionOwnerId(id) {
  return getOwnerId(id);
}

/**
 * Alias của getQuestionById — services/questionOptionService.js (đã có sẵn trên máy bạn)
 * gọi tên "findById". Thêm alias thay vì bắt bạn sửa lại file đó.
 */
async function findById(id) {
  return getQuestionById(id);
}

module.exports = {
  // Giữ nguyên
  createQuestion,
  getQuestionById,
  getQuestionWithCourseInfo,
  getQuestionsByExamId,
  // Mới
  updateQuestion,
  deleteQuestion,
  getOwnerId,
  getQuestionOwnerId,
  findById,
};