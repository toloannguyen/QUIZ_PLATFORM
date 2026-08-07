const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const prisma = new PrismaClient();

// Hàm hỗ trợ: Tạo token
const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const registerUser = async (data) => {
  const { name, email, password, role } = data;

  // 1. Kiểm tra email đã tồn tại chưa
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('Email này đã được sử dụng!', 400);
  }

  // 2. Mã hóa mật khẩu (Độ khó 12 - salt)
  const hashedPassword = await bcrypt.hash(password, 12);

  // 3. Lưu vào Database
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role || 'STUDENT', // Mặc định là STUDENT nếu không truyền lên
    },
  });

  // 4. Xóa mật khẩu khỏi kết quả trả về để bảo mật
  newUser.password = undefined;

  // 5. Cấp Token
  const token = signToken(newUser.id, newUser.role);

  return { user: newUser, token };
};

const loginUser = async (email, password) => {
  // 1. Tìm user theo email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Email hoặc mật khẩu không chính xác!', 401);
  }

  // 2. So sánh mật khẩu người dùng nhập với mật khẩu đã băm trong DB
  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    throw new AppError('Email hoặc mật khẩu không chính xác!', 401);
  }

  // 3. Nếu đúng, cấp token mới
  user.password = undefined;
  const token = signToken(user.id, user.role);

  return { user, token };
};

module.exports = {
  registerUser,
  loginUser,
};