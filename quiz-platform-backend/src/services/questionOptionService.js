const questionOptionRepository = require('../repositories/questionOptionRepository');
const questionRepository = require('../repositories/questionRepository');
const AppError = require('../utils/AppError');

async function addOption(questionId, data) {
  const question = await questionRepository.getQuestionById(questionId);
  if (!question) {
    throw new AppError('Không tìm thấy câu hỏi', 'questionId', 404);
  }
  if (question.type !== 'MULTIPLE_CHOICE') {
    throw new AppError('Chỉ câu hỏi MULTIPLE_CHOICE mới có options', 'questionId', 400);
  }
  return questionOptionRepository.create(questionId, data);
}

async function updateOption(id, data) {
  const option = await questionOptionRepository.findById(id);
  if (!option) {
    throw new AppError('Không tìm thấy option', null, 404);
  }
  return questionOptionRepository.update(id, data);
}

/**
 * LƯU Ý: chưa kiểm tra "phải còn >= 2 option và >= 1 option đúng sau khi xóa" —
 * để đơn giản cho bản đầu tiên. Xem thêm ghi chú trong README.
 */
async function removeOption(id) {
  const option = await questionOptionRepository.findById(id);
  if (!option) {
    throw new AppError('Không tìm thấy option', null, 404);
  }
  return questionOptionRepository.remove(id);
}

module.exports = { addOption, updateOption, removeOption };