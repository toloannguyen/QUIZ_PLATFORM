const questionOptionService = require('../services/questionOptionService');

async function create(req, res) {
  const option = await questionOptionService.addOption(req.params.questionId, req.body);
  res.status(201).json(option);
}

async function update(req, res) {
  const option = await questionOptionService.updateOption(req.params.id, req.body);
  res.json(option);
}

async function remove(req, res) {
  await questionOptionService.removeOption(req.params.id);
  res.status(204).send();
}

module.exports = { create, update, remove };