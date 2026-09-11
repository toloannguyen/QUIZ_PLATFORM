const createLectureSchema = {
  title: { required: true, type: 'string', minLength: 1, maxLength: 255 },
  description: { required: false, type: 'string' },
  courseId: { required: true, type: 'number' },
};

// Không cho đổi courseId qua update — cùng lý do đã áp dụng cho Exam/Question
const updateLectureSchema = {
  title: { required: false, type: 'string', minLength: 1, maxLength: 255 },
  description: { required: false, type: 'string' },
};

module.exports = { createLectureSchema, updateLectureSchema };