/**
 * Bọc 1 async controller/middleware — nếu bên trong throw hoặc reject,
 * tự động chuyển vào errorHandler thông qua next(err) thay vì phải
 * try/catch thủ công ở từng controller.
 *
 * Cách dùng:
 *   router.post('/exams', asyncHandler(examController.create));
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;