/**
 * Error handler tập trung — PHẢI đặt SAU CÙNG trong chuỗi middleware ở server.js
 * (Express nhận diện middleware 4 tham số (err, req, res, next) là error handler).
 *
 * Nhận mọi lỗi được throw trong route (khi dùng asyncHandler) hoặc gọi next(err) thủ công,
 * trả về đúng format { error: true, field, message } — đồng bộ với AI Service.
 *
 * Các custom Error class (vd: AuthError trong authService.js) chỉ cần có sẵn
 * `statusCode` và `field` là handler này tự nhận diện, không cần biết cụ thể là lỗi gì.
 */
function errorHandler(err, req, res, next) {
  // Lỗi Prisma hay gặp nhất khi CRUD: vi phạm unique constraint (vd trùng email)
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: true,
      field: Array.isArray(err.meta?.target) ? err.meta.target[0] : null,
      message: 'Dữ liệu đã tồn tại (vi phạm ràng buộc duy nhất)',
    });
  }

  // Lỗi tham chiếu tới bản ghi không tồn tại (vd examId không có thật)
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: true,
      field: null,
      message: 'Không tìm thấy dữ liệu',
    });
  }

  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    console.error('[ErrorHandler] Lỗi hệ thống:', err);
  }

  return res.status(statusCode).json({
    error: true,
    field: err.field || null,
    message: statusCode >= 500 ? 'Lỗi hệ thống, vui lòng thử lại sau' : err.message,
  });
}

module.exports = errorHandler;