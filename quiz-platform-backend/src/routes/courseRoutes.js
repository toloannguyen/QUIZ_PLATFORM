const express = require('express');
const router = express.Router();

const courseController = require('../controllers/courseController');
const courseRepository = require('../repositories/courseRepository');
const { createCourseSchema, updateCourseSchema } = require('../validations/courseValidation');

const authenticate = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');
const requireOwner = require('../middlewares/resourceOwnership');
const validateRequest = require('../middlewares/validateRequest');
const asyncHandler = require('../middlewares/asyncHandler');

// Mọi route Course đều cần đăng nhập
router.use(authenticate);

// Ai đã đăng nhập cũng xem được danh sách/chi tiết (TEACHER thấy khóa học của mình, ADMIN/STUDENT thấy tất cả)
router.get('/', asyncHandler(courseController.list));
router.get('/:id', asyncHandler(courseController.getOne));

// Chỉ TEACHER/ADMIN được tạo — không cần check ownership vì đang TẠO MỚI, chưa có chủ
router.post(
  '/',
  requireRole('TEACHER', 'ADMIN'),
  validateRequest(createCourseSchema),
  asyncHandler(courseController.create)
);

// Sửa/xóa: phải là TEACHER/ADMIN VÀ phải là chủ sở hữu (ADMIN được bỏ qua check chủ sở hữu)
router.patch(
  '/:id',
  requireRole('TEACHER', 'ADMIN'),
  requireOwner((req) => courseRepository.getOwnerId(req.params.id)),
  validateRequest(updateCourseSchema),
  asyncHandler(courseController.update)
);

router.delete(
  '/:id',
  requireRole('TEACHER', 'ADMIN'),
  requireOwner((req) => courseRepository.getOwnerId(req.params.id)),
  asyncHandler(courseController.remove)
);

module.exports = router;