const prisma = require('../utils/prismaClient');

/**
 * Tìm user theo email — dùng cho login (cần cả password để so sánh)
 * và check trùng email khi register.
 */
async function findByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

/**
 * Tìm user theo id — dùng khi cần lấy thông tin user hiện tại (vd: GET /auth/me).
 * KHÔNG select password.
 */
async function findById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
}

/**
 * Tạo user mới. password truyền vào PHẢI đã hash sẵn (service lo việc hash).
 */
async function createUser({ name, email, password, role }) {
  return prisma.user.create({
    data: { name, email, password, role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
}

module.exports = { findByEmail, findById, createUser };