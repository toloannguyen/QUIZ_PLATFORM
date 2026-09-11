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

router.get('/', asyncHandler(examController.list));

// MỚI — đặt TRƯỚC '/:id' không bắt buộc (Express phân biệt theo số segment trong path,
// '/:id/take' có 2 segment còn '/:id' có 1, nên không đụng nhau dù đặt thứ tự nào),
// nhưng đặt trước cho dễ đọc — route dành cho học sinh lấy đề, đã ẩn đáp án đúng.
router.get('/:id/take', asyncHandler(examController.getForTake));

router.get('/:id', asyncHandler(examController.getOne));

router.post(
  '/',
  requireRole('TEACHER', 'ADMIN'),
  validateRequest(createExamSchema),
  asyncHandler(examController.create)
);

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