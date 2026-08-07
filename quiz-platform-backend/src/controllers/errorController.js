const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Trả về JSON chuẩn hóa cho client
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    // Chỉ hiện chi tiết call stack khi đang ở môi trường phát triển (development)
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = globalErrorHandler;