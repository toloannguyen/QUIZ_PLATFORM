const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');

router.post('/submit', submissionController.submitExam);

module.exports = router;