const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

const SALT_ROUNDS = 10;
const ALLOWED_ROLES = ['ADMIN', 'TEACHER', 'STUDENT'];

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

async function register({ name, email, password, role }) {
  if (!name || !name.trim()) {
    throw new AuthError('Tên không được để trống', 'name');
  }
  if (!email || !isValidEmail(email)) {
    throw new AuthError('Email không hợp lệ', 'email');
  }
  if (!password || password.length < 6) {
    throw new AuthError('Mật khẩu phải có ít nhất 6 ký tự', 'password');
  }
  if (!role || !ALLOWED_ROLES.includes(role)) {
    throw new AuthError('Role không hợp lệ (ADMIN | TEACHER | STUDENT)', 'role');
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
    role,
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
    // Cố tình dùng chung message với sai password — tránh lộ thông tin email nào tồn tại
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