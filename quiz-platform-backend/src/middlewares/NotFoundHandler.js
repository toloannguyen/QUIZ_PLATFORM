/**
 * Bắt mọi request không khớp route nào — đặt SAU toàn bộ app.use(route)
 * và TRƯỚC errorHandler trong server.js.
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: true,
    field: null,
    message: `Route không tồn tại: ${req.method} ${req.originalUrl}`,
  });
}

module.exports = notFoundHandler;