const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const prisma = new PrismaClient();

// 1. AUTHENTICATION: Kiểm tra xem user đã đăng nhập chưa
const protect = catchAsync(async (req, res, next) => {
  // 1.1 Lấy token từ header của Request
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Bạn chưa đăng nhập! Vui lòng đăng nhập để tiếp tục.', 401));
  }

  // 1.2 Xác thực token (kiểm tra xem token có hợp lệ/hết hạn không)
  // Nếu token sai hoặc hết hạn, jwt.verify sẽ tự động quăng lỗi và catchAsync sẽ bắt lấy
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 1.3 Kiểm tra xem user có còn tồn tại trong DB không
  // (Trường hợp user đã bị xóa nhưng token vẫn còn hạn)
  const currentUser = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!currentUser) {
    return next(new AppError('Người dùng sở hữu token này không còn tồn tại.', 401));
  }

  // 1.4 Lưu thông tin user vào req để các hàm phía sau có thể sử dụng
  req.user = currentUser;
  next(); // Cho phép đi qua trạm kiểm soát
});

// 2. AUTHORIZATION: Phân quyền dựa trên Role
// Cách dùng: restrictTo('TEACHER', 'ADMIN')
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // req.user đã được gán từ hàm protect chạy trước đó
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Bạn không có quyền thực hiện hành động này!', 403));
    }
    next(); // Quyền hợp lệ, cho đi tiếp
  };
};

module.exports = {
  protect,
  restrictTo,
};