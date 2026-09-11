const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

const SALT_ROUNDS = 10;

/**
 * Lỗi nghiệp vụ của Auth — controller sẽ dựa vào statusCode/field
 * để trả response đúng format { error: true, field, message }.
 */
class AuthError extends Error {
  constructor(message, field = null, statusCode = 400) {
    super(message);
    this.name = 'AuthError';
    this.field = field;
    this.statusCode = statusCode;
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * QUAN TRỌNG VỀ BẢO MẬT: role KHÔNG được nhận từ client dưới bất kỳ hình thức nào ở đây.
 * Đăng ký công khai LUÔN LUÔN tạo tài khoản STUDENT — hard-code, không đọc từ req.body.
 *
 * Lý do: nếu nhận role từ client (kể cả khi frontend đã ẩn ô chọn role), bất kỳ ai cũng
 * có thể tự phong mình thành TEACHER chỉ bằng cách gọi thẳng API (Postman/curl) với
 * body {..., role: "TEACHER"} — ẩn ở giao diện không ngăn được việc gọi trực tiếp API.
 *
 * Muốn nâng 1 user từ STUDENT lên TEACHER, phải qua hành động RIÊNG của ADMIN
 * (hiện làm tay qua Prisma Studio — nếu cần, xây thêm endpoint
 * PATCH /users/:id/role chỉ ADMIN gọi được, tách biệt hoàn toàn khỏi luồng đăng ký).
 */
async function register({ name, email, password }) {
  if (!name || !name.trim()) {
    throw new AuthError('Tên không được để trống', 'name');
  }
  if (!email || !isValidEmail(email)) {
    throw new AuthError('Email không hợp lệ', 'email');
  }
  if (!password || password.length < 6) {
    throw new AuthError('Mật khẩu phải có ít nhất 6 ký tự', 'password');
  }

  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new AuthError('Email đã được sử dụng', 'email', 409);
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userRepository.createUser({
    name: name.trim(),
    email,
    password: hashedPassword,
    role: 'STUDENT', // Hard-code — KHÔNG bao giờ đọc role từ client ở luồng đăng ký công khai
  });

  const token = signToken(user);
  return { user, token };
}

async function login({ email, password }) {
  if (!email || !password) {
    throw new AuthError('Vui lòng nhập email và mật khẩu', null, 400);
  }

  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new AuthError('Email hoặc mật khẩu không đúng', null, 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AuthError('Email hoặc mật khẩu không đúng', null, 401);
  }

  const token = signToken(user);
  const { password: _password, ...safeUser } = user;
  return { user: safeUser, token };
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

module.exports = { register, login, AuthError };