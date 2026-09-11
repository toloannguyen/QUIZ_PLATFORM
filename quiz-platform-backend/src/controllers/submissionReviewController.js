const submissionService = require('../services/submissionService');

async function list(req, res) {
  const submissions = await submissionService.listSubmissionsForReview(
    { examId: req.query.examId, status: req.query.status },
    req.user
  );
  res.json(submissions);
}

async function getOne(req, res) {
  const submission = await submissionService.getSubmissionDetail(req.params.id, req.user);
  res.json(submission);
}

async function review(req, res) {
  const submission = await submissionService.reviewSubmission(req.params.id, req.body, req.user);
  res.json(submission);
}

module.exports = { list, getOne, review };