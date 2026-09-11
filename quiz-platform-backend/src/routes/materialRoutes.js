const express = require('express');
const router = express.Router();

const materialController = require('../controllers/materialController');
const materialRepository = require('../repositories/materialRepository');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

const authenticate = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');
const requireOwner = require('../middlewares/resourceOwnership');
const asyncHandler = require('../middlewares/asyncHandler');

router.use(authenticate);

router.get('/', asyncHandler(materialController.list)); // GET /materials?lectureId=1
router.get('/:id', asyncHandler(materialController.getOne));

router.post(
  '/upload',
  requireRole('TEACHER', 'ADMIN'),
  uploadMiddleware.single('file'),
  asyncHandler(materialController.upload)
);

router.post(
  '/:id/retry',
  requireRole('TEACHER', 'ADMIN'),
  requireOwner((req) => materialRepository.getOwnerId(req.params.id)),
  asyncHandler(materialController.retry)
);

router.delete(
  '/:id',
  requireRole('TEACHER', 'ADMIN'),
  requireOwner((req) => materialRepository.getOwnerId(req.params.id)),
  asyncHandler(materialController.remove)
);

module.exports = router;