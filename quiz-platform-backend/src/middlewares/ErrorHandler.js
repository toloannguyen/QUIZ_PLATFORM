/**
 * Error handler tập trung — PHẢI đặt SAU CÙNG trong chuỗi middleware ở server.js.
 * Trả về đúng format { error: true, field, message } — đồng bộ với AI Service.
 */
function errorHandler(err, req, res, next) {
  // Vi phạm unique constraint (vd trùng email)
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: true,
      field: Array.isArray(err.meta?.target) ? err.meta.target[0] : null,
      message: 'Dữ liệu đã tồn tại (vi phạm ràng buộc duy nhất)',
    });
  }

  // Không tìm thấy bản ghi để update/delete
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: true,
      field: null,
      message: 'Không tìm thấy dữ liệu',
    });
  }

  // id truyền vào không phải số hợp lệ (vd GET /courses/abc)
  if (err.code === 'P2023' || /invalid.*id|argument.*id/i.test(err.message || '')) {
    return res.status(400).json({
      error: true,
      field: 'id',
      message: 'id không hợp lệ (phải là số)',
    });
  }

  // MỚI: lỗi từ Multer khi upload file (file quá lớn) — LIMIT_FILE_SIZE là mã lỗi chuẩn của Multer
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: true,
      field: 'file',
      message: 'File vượt quá dung lượng cho phép (tối đa 20MB)',
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