const express = require('express');
const router = express.Router();

const submissionReviewController = require('../controllers/submissionReviewController');
const submissionRepository = require('../repositories/submissionRepository');

const authenticate = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');
const requireOwner = require('../middlewares/resourceOwnership');
const asyncHandler = require('../middlewares/asyncHandler');

router.use(authenticate);

// GET /submissions?examId=1&status=AUTO_GRADED — danh sách bài cần review (TEACHER/ADMIN)
router.get(
  '/',
  requireRole('TEACHER', 'ADMIN'),
  asyncHandler(submissionReviewController.list)
);

// GET /submissions/:id — TEACHER (chủ đề) hoặc STUDENT (chủ bài nộp) xem chi tiết.
// Check quyền nằm trong service (submissionService.getSubmissionDetail), KHÔNG dùng
// requireOwner middleware vì điều kiện khác nhau tùy role, không phải ownership 1 chiều.
router.get('/:id', asyncHandler(submissionReviewController.getOne));

router.patch(
  '/:id/review',
  requireRole('TEACHER', 'ADMIN'),
  requireOwner((req) => submissionRepository.getSubmissionOwnerId(req.params.id)),
  asyncHandler(submissionReviewController.review)
);

module.exports = router;