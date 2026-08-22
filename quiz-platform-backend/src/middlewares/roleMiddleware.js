/**
 * Kiểm tra req.user.role có nằm trong danh sách role được phép không.
 * PHẢI đặt SAU authMiddleware trong chuỗi middleware (cần req.user đã có sẵn).
 *
 * Cách dùng:
 *   router.post('/exams', authenticate, requireRole('TEACHER', 'ADMIN'), examController.create);
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        field: null,
        message: 'Chưa xác thực',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: true,
        field: null,
        message: 'Bạn không có quyền thực hiện hành động này',
      });
    }

    return next();
  };
}

module.exports = requireRole;