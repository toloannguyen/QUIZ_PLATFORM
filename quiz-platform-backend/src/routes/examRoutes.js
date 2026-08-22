const express = require('express');
const router = express.Router();

const examController = require('../controllers/examController');
const examRepository = require('../repositories/examRepository');
const { createExamSchema, updateExamSchema } = require('../validations/examValidation');

const authenticate = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');
const requireOwner = require('../middlewares/resourceOwnership');
const validateRequest = require('../middlewares/validateRequest');
const asyncHandler = require('../middlewares/asyncHandler');

router.use(authenticate);

// Hỗ trợ GET /exams?courseId=1 để lọc theo khóa học
router.get('/', asyncHandler(examController.list));
router.get('/:id', asyncHandler(examController.getOne));

// Tạo mới: check ownership của COURSE (không phải Exam, vì Exam chưa tồn tại) — xử lý trong examService
router.post(
  '/',
  requireRole('TEACHER', 'ADMIN'),
  validateRequest(createExamSchema),
  asyncHandler(examController.create)
);

// Sửa/xóa: check ownership của chính Exam đó
router.patch(
  '/:id',
  requireRole('TEACHER', 'ADMIN'),
  requireOwner((req) => examRepository.getOwnerId(req.params.id)),
  validateRequest(updateExamSchema),
  asyncHandler(examController.update)
);

router.delete(
  '/:id',
  requireRole('TEACHER', 'ADMIN'),
  requireOwner((req) => examRepository.getOwnerId(req.params.id)),
  asyncHandler(examController.remove)
);

module.exports = router;