const prisma = require('../utils/prismaClient');
const submissionRepository = require('../repositories/submissionRepository');
const { gradeAnswer } = require('./gradingService');
const AppError = require('../utils/AppError');

// ===== GIỮ NGUYÊN 100% — không đổi 1 dòng nào =====

async function submitExam(examId, studentId, answersPayload) {
  const submission = await submissionRepository.createSubmission(examId, studentId);

  let totalScore = 0;
  let hasGradingError = false;
  const gradedAnswers = [];

  for (const answerItem of answersPayload) {
    const question = await prisma.question.findUnique({
      where: { id: answerItem.questionId }
    });

    if (!question) continue;

    const graded = await gradeAnswer(question, answerItem);

    if (graded.autoScore === null) {
      hasGradingError = true;
    } else {
      totalScore += graded.autoScore;
    }

    const savedAnswer = await submissionRepository.createSubmissionAnswer({
      submissionId: submission.id,
      questionId: question.id,
      ...graded
    });

    gradedAnswers.push(savedAnswer);
  }

  const finalStatus = hasGradingError ? 'PENDING' : 'AUTO_GRADED';
  await submissionRepository.updateSubmissionStatus(submission.id, finalStatus, totalScore);

  return {
    submissionId: submission.id,
    status: finalStatus,
    totalScore,
    answers: gradedAnswers
  };
}

// ===== MỚI — luồng Review giáo viên =====

const NON_REVIEWABLE_STATUSES = ['COMPLETED'];

function assertCanReview(status) {
  if (NON_REVIEWABLE_STATUSES.includes(status)) {
    throw new AppError('Bài nộp đã hoàn tất (COMPLETED), không thể sửa điểm nữa', null, 400);
  }
}

async function listSubmissionsForReview(filters, user) {
  const teacherId = user.role === 'TEACHER' ? user.id : undefined;
  return submissionRepository.listSubmissions({
    examId: filters.examId,
    status: filters.status,
    teacherId,
  });
}

/**
 * TEACHER chỉ xem được bài nộp thuộc đề của chính mình; STUDENT chỉ xem được bài của chính mình;
 * ADMIN xem được tất cả. Không dùng requireOwner middleware ở route vì điều kiện khác nhau tùy role
 * (không phải ownership 1 chiều đơn giản như Course/Exam/Question).
 */
async function getSubmissionDetail(id, user) {
  const submission = await submissionRepository.getSubmissionWithAnswers(Number(id));
  if (!submission) {
    throw new AppError('Không tìm thấy bài nộp', null, 404);
  }

  if (user.role === 'STUDENT') {
    if (submission.studentId !== user.id) {
      throw new AppError('Bạn không có quyền xem bài nộp này', null, 403);
    }
  } else if (user.role === 'TEACHER') {
    const ownerId = await submissionRepository.getSubmissionOwnerId(id);
    if (ownerId !== user.id) {
      throw new AppError('Bạn không phải giáo viên của đề thi này', null, 403);
    }
  }
  // ADMIN luôn được xem, không cần check

  return submission;
}

/**
 * Giáo viên sửa điểm/nhận xét cho 1 hoặc nhiều câu trong 1 bài nộp.
 *
 * body.answers: [{ answerId, teacherScore, teacherFeedback }] — có thể chỉ gửi 1 vài câu,
 *   không bắt buộc gửi hết tất cả câu trong bài.
 * body.finalize: true -> chuyển status COMPLETED (chốt điểm), false/undefined -> REVIEWED
 *   (vẫn có thể sửa tiếp sau đó, miễn chưa finalize).
 *
 * finalScore được TÍNH LẠI TOÀN BỘ sau mỗi lần review (không chỉ câu vừa sửa), theo công thức:
 *   mỗi câu = teacherScore nếu giáo viên đã chấm tay, không thì dùng autoScore (AI/multiple choice),
 *   không có cả 2 thì tính 0 — đảm bảo finalScore luôn nhất quán dù giáo viên chỉ sửa 1 phần.
 *
 * Submission.teacherScore CHỈ được set khi finalize=true (coi là "điểm giáo viên đã chốt");
 * lúc REVIEWED (chưa chốt) chỉ cập nhật finalScore để xem trước, không set teacherScore.
 */
async function reviewSubmission(id, { answers = [], finalize = false }, user) {
  const submission = await submissionRepository.getSubmissionWithAnswers(Number(id));
  if (!submission) {
    throw new AppError('Không tìm thấy bài nộp', null, 404);
  }

  assertCanReview(submission.status);

  const answerIdsInSubmission = new Set(submission.answers.map((a) => a.id));

  for (const item of answers) {
    const answerId = Number(item.answerId);

    if (!answerIdsInSubmission.has(answerId)) {
      throw new AppError(`answerId ${item.answerId} không thuộc bài nộp này`, 'answerId', 400);
    }

    if (item.teacherScore !== undefined) {
      const answer = submission.answers.find((a) => a.id === answerId);
      if (
        typeof item.teacherScore !== 'number' ||
        item.teacherScore < 0 ||
        item.teacherScore > answer.question.maxScore
      ) {
        throw new AppError(
          `teacherScore phải là số từ 0 đến ${answer.question.maxScore} (điểm tối đa của câu hỏi)`,
          'teacherScore',
          400
        );
      }
    }

    await submissionRepository.updateSubmissionAnswerReview(answerId, {
      teacherScore: item.teacherScore,
      teacherFeedback: item.teacherFeedback,
    });
  }

  // Lấy lại bản mới nhất sau khi update để tính finalScore chính xác
  const refreshed = await submissionRepository.getSubmissionWithAnswers(Number(id));
  const finalScore = refreshed.answers.reduce((sum, a) => sum + (a.teacherScore ?? a.autoScore ?? 0), 0);

  const status = finalize ? 'COMPLETED' : 'REVIEWED';
  const updateData = { finalScore, status };
  if (finalize) {
    updateData.teacherScore = finalScore;
  }

  await submissionRepository.updateSubmissionReview(id, updateData);

  return submissionRepository.getSubmissionWithAnswers(Number(id));
}

async function listStudentSubmissions(user) {
  if (!user || !user.id) {
    throw new AppError('User không hợp lệ', null, 401);
  }

  // Only students should call this; admins can be supported later if needed
  return submissionRepository.listSubmissionsByStudent(user.id);
}

module.exports = {
  // Giữ nguyên
  submitExam,
  // Mới
  listSubmissionsForReview,
  getSubmissionDetail,
  reviewSubmission,
  // Student
  listStudentSubmissions,
};