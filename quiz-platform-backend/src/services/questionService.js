const questionRepository = require('../repositories/questionRepository');
const examRepository = require('../repositories/examRepository');
const AppError = require('../utils/AppError');

/**
 * Ràng buộc nghiệp vụ theo type — đúng quy ước đã thống nhất trong tài liệu handoff gốc:
 * - SHORT_ANSWER: correctAnswer bắt buộc (dùng làm reference_answer cho AI Service), không có options.
 * - ESSAY: correctAnswer PHẢI null (dùng RAG qua Material), không có options.
 * - MULTIPLE_CHOICE: correctAnswer PHẢI null (đáp án nằm ở options[].isCorrect),
 *   bắt buộc >= 2 options, ít nhất 1 option isCorrect=true.
 */
function validateByType(type, { correctAnswer, options }) {
  if (type === 'SHORT_ANSWER') {
    if (!correctAnswer || !correctAnswer.trim()) {
      throw new AppError('correctAnswer là bắt buộc với câu hỏi SHORT_ANSWER', 'correctAnswer', 400);
    }
    if (options && options.length > 0) {
      throw new AppError('SHORT_ANSWER không được có options', 'options', 400);
    }
    return;
  }

  if (type === 'ESSAY') {
    if (correctAnswer) {
      throw new AppError('correctAnswer phải để trống với câu hỏi ESSAY (dùng RAG qua Material)', 'correctAnswer', 400);
    }
    if (options && options.length > 0) {
      throw new AppError('ESSAY không được có options', 'options', 400);
    }
    return;
  }

  if (type === 'MULTIPLE_CHOICE') {
    if (correctAnswer) {
      throw new AppError('correctAnswer phải để trống với MULTIPLE_CHOICE (đáp án nằm ở options)', 'correctAnswer', 400);
    }
    if (!options || options.length < 2) {
      throw new AppError('MULTIPLE_CHOICE cần ít nhất 2 options', 'options', 400);
    }
    const correctCount = options.filter((o) => o.isCorrect).length;
    if (correctCount < 1) {
      throw new AppError('MULTIPLE_CHOICE cần ít nhất 1 option đúng (isCorrect=true)', 'options', 400);
    }
  }
}

async function listQuestions(examId, user) {
  if (!examId) {
    throw new AppError('Thiếu tham số examId', 'examId', 400);
  }

  const exam = await examRepository.findById(examId);
  if (!exam) {
    throw new AppError('Không tìm thấy đề thi', 'examId', 404);
  }
  if (user.role === 'TEACHER' && exam.teacherId !== user.id) {
    throw new AppError('Bạn không phải chủ sở hữu đề thi này', null, 403);
  }

  return questionRepository.getQuestionsByExamId(examId);
}

async function getQuestionsForExam(examId, user) {
  return listQuestions(examId, user);
}

async function getQuestionById(id) {
  const question = await questionRepository.getQuestionById(id);
  if (!question) {
    throw new AppError('Không tìm thấy câu hỏi', null, 404);
  }
  return question;
}

/**
 * Tạo Question mới — 2 lớp kiểm tra:
 * 1. examId truyền vào (trong data) phải thuộc đúng giáo viên đang tạo.
 * 2. Ràng buộc nghiệp vụ theo type (validateByType).
 */
async function createQuestion(data, user) {
  const exam = await examRepository.findById(data.examId);
  if (!exam) {
    throw new AppError('Đề thi không tồn tại', 'examId', 404);
  }
  if (user.role !== 'ADMIN' && exam.teacherId !== user.id) {
    throw new AppError('Bạn không phải chủ sở hữu đề thi này, không thể thêm câu hỏi', 'examId', 403);
  }

  validateByType(data.type, { correctAnswer: data.correctAnswer, options: data.options });

  const { options, ...rest } = data;
  const payload = {
    ...rest,
    examId: Number(data.examId),
    correctAnswer: data.correctAnswer ?? null,
    // Nested write của Prisma — createQuestion(data) trong repository không cần đổi gì thêm,
    // Prisma tự nhận diện payload.options = { create: [...] } và tạo Question + options cùng lúc.
    options:
      options && options.length > 0
        ? { create: options.map((o) => ({ optionText: o.optionText, isCorrect: !!o.isCorrect })) }
        : undefined,
  };

  return questionRepository.createQuestion(payload);
}

/**
 * KHÔNG cho đổi `type`/`examId` qua update (giống lý do courseId ở Exam — đổi type sẽ phá vỡ
 * ràng buộc options/correctAnswer đã có). correctAnswer mới (nếu có) vẫn phải hợp lệ với type
 * HIỆN TẠI của câu hỏi.
 */
async function updateQuestion(id, data) {
  const existing = await getQuestionById(id);

  if (data.correctAnswer !== undefined) {
    validateByType(existing.type, {
      correctAnswer: data.correctAnswer,
      options: existing.options,
    });
  }

  const { type, examId, options, ...safeData } = data;
  return questionRepository.updateQuestion(id, safeData);
}

async function deleteQuestion(id) {
  await getQuestionById(id);
  return questionRepository.deleteQuestion(id);
}

module.exports = {
  listQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  validateByType,
};