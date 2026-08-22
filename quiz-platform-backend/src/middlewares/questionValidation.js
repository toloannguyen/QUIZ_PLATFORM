const QUESTION_TYPES = ['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'ESSAY'];

// Đây chỉ là validate CẤU TRÚC (field nào bắt buộc, đúng kiểu dữ liệu).
// Ràng buộc NGHIỆP VỤ theo type (correctAnswer bắt buộc/cấm, options bắt buộc/cấm)
// nằm trong questionService.validateByType() — không đưa vào đây vì validateRequest
// không xử lý được logic điều kiện phức tạp (if type=X thì field Y bắt buộc).
const createQuestionSchema = {
  examId: { required: true, type: 'number' },
  orderNumber: { required: true, type: 'number', min: 1 },
  part: { required: true, type: 'number', min: 1 },
  type: { required: true, type: 'string', enum: QUESTION_TYPES },
  title: { required: false, type: 'string' },
  content: { required: true, type: 'string', minLength: 1 },
  maxScore: { required: true, type: 'number', min: 0 },
  correctAnswer: { required: false, type: 'string' },
  explanation: { required: false, type: 'string' },
};

// KHÔNG có `type` và `examId` — cố tình không cho đổi qua update (giống lý do courseId ở Exam).
const updateQuestionSchema = {
  orderNumber: { required: false, type: 'number', min: 1 },
  part: { required: false, type: 'number', min: 1 },
  title: { required: false, type: 'string' },
  content: { required: false, type: 'string', minLength: 1 },
  maxScore: { required: false, type: 'number', min: 0 },
  correctAnswer: { required: false, type: 'string' },
  explanation: { required: false, type: 'string' },
};

module.exports = { createQuestionSchema, updateQuestionSchema, QUESTION_TYPES };