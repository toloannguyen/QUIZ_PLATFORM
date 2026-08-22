/**
 * Kiểm tra user hiện tại có phải chủ sở hữu tài nguyên không.
 * Khác với roleMiddleware (chỉ check role chung), middleware này check
 * CỤ THỂ record đó thuộc về ai — vd: giáo viên A không được sửa Course của giáo viên B
 * dù cả 2 cùng role TEACHER.
 *
 * ADMIN luôn được bỏ qua check này (toàn quyền).
 *
 * PHẢI đặt SAU authenticate (cần req.user) và thường đặt SAU requireRole.
 *
 * Cách dùng:
 *   router.patch(
 *     '/:id',
 *     authenticate,
 *     requireRole('TEACHER', 'ADMIN'),
 *     requireOwner((req) => courseRepository.getOwnerId(req.params.id)),
 *     courseController.update
 *   );
 *
 * @param {(req: Request) => Promise<number|null>} getOwnerId
 *   Hàm async trả về id của chủ sở hữu record (vd teacherId), hoặc null nếu record không tồn tại.
 */
function requireOwner(getOwnerId) {
  return async (req, res, next) => {
    try {
      const ownerId = await getOwnerId(req);

      if (ownerId === null || ownerId === undefined) {
        return res.status(404).json({
          error: true,
          field: null,
          message: 'Không tìm thấy dữ liệu',
        });
      }

      if (req.user.role !== 'ADMIN' && ownerId !== req.user.id) {
        return res.status(403).json({
          error: true,
          field: null,
          message: 'Bạn không phải chủ sở hữu tài nguyên này',
        });
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = requireOwner;