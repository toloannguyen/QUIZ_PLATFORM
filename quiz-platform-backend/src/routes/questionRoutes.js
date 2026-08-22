const express = require('express');
const router = express.Router();

const questionController = require('../controllers/questionController');
const questionOptionController = require('../controllers/questionOptionController');
const questionRepository = require('../repositories/questionRepository');
const questionOptionRepository = require('../repositories/questionOptionRepository');
const { createQuestionSchema, updateQuestionSchema } = require('../validations/questionValidation');
const { createOptionSchema, updateOptionSchema } = require('../validations/questionOptionValidation');

const authenticate = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');
const requireOwner = require('../middlewares/resourceOwnership');
const validateRequest = require('../middlewares/validateRequest');
const asyncHandler = require('../middlewares/asyncHandler');

router.use(authenticate);

router.get('/', asyncHandler(questionController.list));
router.get('/:id', asyncHandler(questionController.getOne));

router.post(
  '/',
  requireRole('TEACHER', 'ADMIN'),
  validateRequest(createQuestionSchema),
  asyncHandler(questionController.create)
);

router.patch(
  '/:id',
  requireRole('TEACHER', 'ADMIN'),
  requireOwner((req) => questionRepository.getQuestionOwnerId(req.params.id)),
  validateRequest(updateQuestionSchema),
  asyncHandler(questionController.update)
);

router.delete(
  '/:id',
  requireRole('TEACHER', 'ADMIN'),
  requireOwner((req) => questionRepository.getQuestionOwnerId(req.params.id)),
  asyncHandler(questionController.remove)
);

router.post(
  '/:questionId/options',
  requireRole('TEACHER', 'ADMIN'),
  requireOwner((req) => questionRepository.getQuestionOwnerId(req.params.questionId)),
  validateRequest(createOptionSchema),
  asyncHandler(questionOptionController.create)
);

router.patch(
  '/options/:id',
  requireRole('TEACHER', 'ADMIN'),
  requireOwner((req) => questionOptionRepository.getOwnerId(req.params.id)),
  validateRequest(updateOptionSchema),
  asyncHandler(questionOptionController.update)
);

router.delete(
  '/options/:id',
  requireRole('TEACHER', 'ADMIN'),
  requireOwner((req) => questionOptionRepository.getOwnerId(req.params.id)),
  asyncHandler(questionOptionController.remove)
);

module.exports = router;