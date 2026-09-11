const prisma = require('../utils/prismaClient');

// ===== GIỮ NGUYÊN — không đổi gì các hàm đã có từ trước =====

async function findById(id) {
  return prisma.exam.findUnique({ where: { id: Number(id) } });
}

async function findMany({ teacherId, courseId, studentId } = {}) {
  const where = {};
  if (teacherId) where.teacherId = Number(teacherId);
  if (courseId) where.courseId = Number(courseId);
  if (studentId) {
    where.course = {
      enrollments: {
        some: {
          studentId: Number(studentId),
        },
      },
    };
  }

  return prisma.exam.findMany({
    where: Object.keys(where).length ? where : undefined,
    orderBy: { createdAt: 'desc' },
  });
}

async function create({ title, description, duration, dueDate, courseId, teacherId }) {
  return prisma.exam.create({
    data: { title, description, duration, dueDate, courseId, teacherId },
  });
}

async function update(id, data) {
  return prisma.exam.update({ where: { id: Number(id) }, data });
}

async function remove(id) {
  return prisma.exam.delete({ where: { id: Number(id) } });
}

async function getOwnerId(id) {
  const exam = await prisma.exam.findUnique({
    where: { id: Number(id) },
    select: { teacherId: true },
  });
  return exam ? exam.teacherId : null;
}

// ===== MỚI — dùng riêng cho luồng học sinh làm bài =====

/**
 * Lấy Exam kèm danh sách Question + Option, CHỈ chọn field an toàn cho học sinh.
 * Dùng Prisma `select` (whitelist) thay vì fetch hết rồi xóa field bằng tay —
 * an toàn hơn: nếu quên, field nhạy cảm (correctAnswer, explanation, isCorrect)
 * sẽ KHÔNG BAO GIỜ lọt ra ngoài vì bị chặn ngay ở tầng query, không phụ thuộc
 * việc code phía sau có nhớ xóa hay không.
 *
 * CỐ TÌNH KHÔNG chọn: Question.correctAnswer, Question.explanation, QuestionOption.isCorrect.
 */
async function findByIdWithQuestionsForStudent(id) {
  return prisma.exam.findUnique({
    where: { id: Number(id) },
    select: {
      id: true,
      title: true,
      description: true,
      duration: true,
      dueDate: true,
      totalQuestion: true,
      totalScore: true,
      courseId: true,
      questions: {
        orderBy: [{ part: 'asc' }, { orderNumber: 'asc' }],
        select: {
          id: true,
          orderNumber: true,
          part: true,
          type: true,
          title: true,
          content: true,
          maxScore: true,
          options: {
            select: {
              id: true,
              optionText: true,
              // isCorrect CỐ TÌNH không chọn
            },
          },
          // correctAnswer, explanation CỐ TÌNH không chọn
        },
      },
    },
  });
}

module.exports = {
  findById,
  findMany,
  create,
  update,
  remove,
  getOwnerId,
  findByIdWithQuestionsForStudent,
};