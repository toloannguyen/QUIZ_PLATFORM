const questionService = require('../services/questionService');

async function list(req, res) {
  const { examId } = req.query;
  if (!examId) {
    return res.status(400).json({ error: true, field: 'examId', message: 'Thiếu tham số examId' });
  }
  const questions = await questionService.listQuestions(Number(examId), req.user);
  res.json(questions);
}

async function getOne(req, res) {
  const question = await questionService.getQuestionById(req.params.id);
  res.json(question);
}

async function create(req, res) {
  const question = await questionService.createQuestion(req.body, req.user);
  res.status(201).json(question);
}

async function update(req, res) {
  const question = await questionService.updateQuestion(req.params.id, req.body);
  res.json(question);
}

async function remove(req, res) {
  await questionService.deleteQuestion(req.params.id);
  res.status(204).send();
}

module.exports = { list, getOne, create, update, remove };