/**
 * Error class nghiệp vụ dùng chung cho toàn bộ Backend.
 * errorHandler.js đã nhận diện sẵn `statusCode` và `field` nên mọi service
 * chỉ cần throw new AppError(...) là tự động ra đúng format response.
 *
 * authService.js hiện đang dùng AuthError riêng — vẫn chạy tốt, không bắt buộc đổi,
 * nhưng từ CourseService trở đi nên dùng chung AppError này để đỡ lặp code.
 */
class AppError extends Error {
  constructor(message, field = null, statusCode = 400) {
    super(message);
    this.name = 'AppError';
    this.field = field;
    this.statusCode = statusCode;
  }
}

module.exports = AppError;