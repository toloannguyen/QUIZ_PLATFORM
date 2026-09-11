const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const authenticate = require('../middlewares/authMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');

router.use(authenticate);
router.get('/my', asyncHandler(submissionController.listMySubmissions));
router.post('/submit', asyncHandler(submissionController.submitExam));

module.exports = router;