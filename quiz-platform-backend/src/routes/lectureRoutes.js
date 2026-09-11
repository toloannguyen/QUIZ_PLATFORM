const express = require('express');
const router = express.Router();

const lectureController = require('../controllers/lectureController');
const lectureRepository = require('../repositories/lectureRepository');
const { createLectureSchema, updateLectureSchema } = require('../validations/lectureValidation');

const authenticate = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');
const requireOwner = require('../middlewares/resourceOwnership');
const validateRequest = require('../middlewares/validateRequest');
const asyncHandler = require('../middlewares/asyncHandler');

router.use(authenticate);

router.get('/', asyncHandler(lectureController.list)); // GET /lectures?courseId=1
router.get('/:id', asyncHandler(lectureController.getOne));

router.post(
  '/',
  requireRole('TEACHER', 'ADMIN'),
  validateRequest(createLectureSchema),
  asyncHandler(lectureController.create)
);

router.patch(
  '/:id',
  requireRole('TEACHER', 'ADMIN'),
  requireOwner((req) => lectureRepository.getOwnerId(req.params.id)),
  validateRequest(updateLectureSchema),
  asyncHandler(lectureController.update)
);

router.delete(
  '/:id',
  requireRole('TEACHER', 'ADMIN'),
  requireOwner((req) => lectureRepository.getOwnerId(req.params.id)),
  asyncHandler(lectureController.remove)
);

module.exports = router;