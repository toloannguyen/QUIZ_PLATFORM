const prisma = require('../utils/prismaClient');

async function findById(id) {
  return prisma.exam.findUnique({ where: { id: Number(id) } });
}

async function findMany({ teacherId, courseId } = {}) {
  const where = {};
  if (teacherId) where.teacherId = Number(teacherId);
  if (courseId) where.courseId = Number(courseId);

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

/** Dùng riêng cho resourceOwnership middleware. */
async function getOwnerId(id) {
  const exam = await prisma.exam.findUnique({
    where: { id: Number(id) },
    select: { teacherId: true },
  });
  return exam ? exam.teacherId : null;
}

module.exports = { findById, findMany, create, update, remove, getOwnerId };