const prisma = require('../utils/prismaClient');

async function findById(id) {
  return prisma.questionOption.findUnique({ where: { id: Number(id) } });
}

async function create(questionId, { optionText, isCorrect }) {
  return prisma.questionOption.create({
    data: { questionId: Number(questionId), optionText, isCorrect: !!isCorrect },
  });
}

async function update(id, data) {
  return prisma.questionOption.update({ where: { id: Number(id) }, data });
}

async function remove(id) {
  return prisma.questionOption.delete({ where: { id: Number(id) } });
}

/**
 * QuestionOption -> Question -> Exam -> teacherId (2 lớp join).
 * Dùng cho requireOwner middleware khi sửa/xóa 1 option riêng lẻ.
 */
async function getOwnerId(id) {
  const option = await prisma.questionOption.findUnique({
    where: { id: Number(id) },
    select: { question: { select: { exam: { select: { teacherId: true } } } } },
  });
  return option ? option.question.exam.teacherId : null;
}

module.exports = { findById, create, update, remove, getOwnerId };