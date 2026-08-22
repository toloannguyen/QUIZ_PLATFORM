const examService = require('../services/examService');

async function list(req, res) {
  const exams = await examService.listExams(req.user, { courseId: req.query.courseId });
  res.json(exams);
}

async function getOne(req, res) {
  const exam = await examService.getExamById(req.params.id);
  res.json(exam);
}

async function create(req, res) {
  const exam = await examService.createExam(req.body, req.user);
  res.status(201).json(exam);
}

async function update(req, res) {
  const exam = await examService.updateExam(req.params.id, req.body);
  res.json(exam);
}

async function remove(req, res) {
  await examService.deleteExam(req.params.id);
  res.status(204).send();
}

module.exports = { list, getOne, create, update, remove };