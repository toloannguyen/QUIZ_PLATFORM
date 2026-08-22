const courseService = require('../services/courseService');

async function list(req, res) {
  const courses = await courseService.listCourses(req.user);
  res.json(courses);
}

async function getOne(req, res) {
  const course = await courseService.getCourseById(req.params.id);
  res.json(course);
}

async function create(req, res) {
  const course = await courseService.createCourse(req.body, req.user);
  res.status(201).json(course);
}

async function update(req, res) {
  const course = await courseService.updateCourse(req.params.id, req.body);
  res.json(course);
}

async function remove(req, res) {
  await courseService.deleteCourse(req.params.id);
  res.status(204).send();
}

module.exports = { list, getOne, create, update, remove };