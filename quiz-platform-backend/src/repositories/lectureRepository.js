const prisma = require('../utils/prismaClient');

async function findById(id) {
  return prisma.lecture.findUnique({ where: { id: Number(id) } });
}

async function findByCourseId(courseId) {
  return prisma.lecture.findMany({
    where: { courseId: Number(courseId) },
    orderBy: { createdAt: 'desc' },
  });
}

async function create({ title, description, courseId }) {
  return prisma.lecture.create({ data: { title, description, courseId: Number(courseId) } });
}

async function update(id, data) {
  return prisma.lecture.update({ where: { id: Number(id) }, data });
}

async function remove(id) {
  return prisma.lecture.delete({ where: { id: Number(id) } });
}

/** Lecture -> Course -> teacherId. */
async function getOwnerId(id) {
  const lecture = await prisma.lecture.findUnique({
    where: { id: Number(id) },
    select: { course: { select: { teacherId: true } } },
  });
  return lecture ? lecture.course.teacherId : null;
}

module.exports = { findById, findByCourseId, create, update, remove, getOwnerId };