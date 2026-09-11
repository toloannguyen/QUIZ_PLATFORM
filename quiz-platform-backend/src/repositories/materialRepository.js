const prisma = require('../utils/prismaClient');

async function findById(id) {
  return prisma.material.findUnique({ where: { id: Number(id) } });
}

async function findByLectureId(lectureId) {
  return prisma.material.findMany({
    where: { lectureId: Number(lectureId) },
    orderBy: { uploadedAt: 'desc' },
  });
}

async function create({ title, fileName, fileUrl, fileType, lectureId }) {
  return prisma.material.create({
    data: { title, fileName, fileUrl, fileType, lectureId: Number(lectureId) },
  });
}

async function updateAiStatus(id, { aiProcessed, aiChunkCount, aiError }) {
  return prisma.material.update({
    where: { id: Number(id) },
    data: { aiProcessed, aiChunkCount, aiError },
  });
}

async function remove(id) {
  return prisma.material.delete({ where: { id: Number(id) } });
}

/** Material -> Lecture -> Course -> teacherId (3 lớp join). */
async function getOwnerId(id) {
  const material = await prisma.material.findUnique({
    where: { id: Number(id) },
    select: { lecture: { select: { course: { select: { teacherId: true } } } } },
  });
  return material ? material.lecture.course.teacherId : null;
}

/** Material -> Lecture -> courseId — cần để gọi AI Service (upload-reference cần course_id). */
async function getCourseId(id) {
  const material = await prisma.material.findUnique({
    where: { id: Number(id) },
    select: { lecture: { select: { courseId: true } } },
  });
  return material ? material.lecture.courseId : null;
}

module.exports = { findById, findByLectureId, create, updateAiStatus, remove, getOwnerId, getCourseId };