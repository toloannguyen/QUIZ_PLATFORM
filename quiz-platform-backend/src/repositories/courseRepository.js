const prisma = require('../utils/prismaClient');

async function findById(id) {
  return prisma.course.findUnique({ where: { id: Number(id) } });
}

/**
 * TEACHER chỉ thấy khóa học của mình, ADMIN/STUDENT thấy tất cả
 * (lọc theo teacherId do service quyết định, repository chỉ nhận filter sẵn).
 */
async function findMany({ teacherId } = {}) {
  return prisma.course.findMany({
    where: teacherId ? { teacherId: Number(teacherId) } : undefined,
    orderBy: { createdAt: 'desc' },
  });
}

async function create({ title, description, teacherId }) {
  return prisma.course.create({
    data: { title, description, teacherId },
  });
}

async function update(id, data) {
  return prisma.course.update({ where: { id: Number(id) }, data });
}

async function remove(id) {
  return prisma.course.delete({ where: { id: Number(id) } });
}

/**
 * Dùng riêng cho resourceOwnership middleware — chỉ lấy teacherId,
 * không load cả record cho nhẹ.
 */
async function getOwnerId(id) {
  const course = await prisma.course.findUnique({
    where: { id: Number(id) },
    select: { teacherId: true },
  });
  return course ? course.teacherId : null;
}

module.exports = { findById, findMany, create, update, remove, getOwnerId };