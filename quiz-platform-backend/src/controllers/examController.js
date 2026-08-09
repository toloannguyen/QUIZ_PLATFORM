const examService = require('../services/examService');
const catchAsync = require('../utils/catchAsync');

const createExam = catchAsync(async (req, res, next) => {
  const teacherId = req.user.id;
  const result = await examService.createExam(teacherId, req.body);

  res.status(201).json({
    status: 'success',
    data: { exam: result },
  });
});

const createQuestion = catchAsync(async (req, res, next) => {
  const teacherId = req.user.id;
  const examId = parseInt(req.params.examId, 10);
  
  const result = await examService.createQuestion(teacherId, examId, req.body);

  res.status(201).json({
    status: 'success',
    data: { question: result },
  });
});
// Phase 5:
const getExam = catchAsync(async (req, res, next) => {
  const examId = parseInt(req.params.id, 10);
  
  const result = await examService.getExamById(examId);

  res.status(200).json({
    status: 'success',
    data: { exam: result },
  });
});
module.exports = {
  createExam,
  createQuestion,
  getExam, // Thêm dòng này
};