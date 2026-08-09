const submissionService = require('../services/submissionService');
const catchAsync = require('../utils/catchAsync');

const startExam = catchAsync(async (req, res, next) => {
  const studentId = req.user.id;
  const examId = parseInt(req.params.examId, 10);

  const result = await submissionService.startExam(studentId, examId);

  res.status(200).json({
    status: 'success',
    data: { submission: result }
  });
});

const submitExam = catchAsync(async (req, res, next) => {
  const studentId = req.user.id;
  const examId = parseInt(req.params.examId, 10);

  const result = await submissionService.submitExam(studentId, examId, req.body);

  res.status(200).json({
    status: 'success',
    message: 'Nộp bài và chấm điểm thành công!',
    data: { result }
  });
});

module.exports = {
  startExam,
  submitExam
};