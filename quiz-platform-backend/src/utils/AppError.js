class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    // Nếu statusCode bắt đầu bằng 4 (4xx) thì là client error, ngược lại là server error (5xx)
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Phân biệt lỗi do chúng ta chủ động bắt (Operational) hay lỗi bất ngờ do bug code

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;