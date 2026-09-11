const lectureService = require('../services/lectureService');

async function list(req, res) {
  const lectures = await lectureService.listLectures(req.query.courseId);
  res.json(lectures);
}

async function getOne(req, res) {
  const lecture = await lectureService.getLectureById(req.params.id);
  res.json(lecture);
}

async function create(req, res) {
  const lecture = await lectureService.createLecture(req.body, req.user);
  res.status(201).json(lecture);
}

async function update(req, res) {
  const lecture = await lectureService.updateLecture(req.params.id, req.body);
  res.json(lecture);
}

async function remove(req, res) {
  await lectureService.deleteLecture(req.params.id);
  res.status(204).send();
}

module.exports = { list, getOne, create, update, remove };