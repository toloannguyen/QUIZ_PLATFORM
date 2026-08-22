const createExamSchema = {
  title: { required: true, type: 'string', maxLength: 255, minLength: 1 },
  description: { required: false, type: 'string' },
  duration: { required: true, type: 'number', min: 1 }, // phút
  dueDate: { required: true, type: 'date' },
  courseId: { required: true, type: 'number' },
};

// KHÔNG cho sửa courseId qua update — đổi khóa học của 1 đề thi đã tồn tại là thay đổi
// bản chất dữ liệu (câu hỏi, submission cũ đều gắn với course cũ), nên coi là hành động
// "xóa tạo lại" chứ không phải "sửa".
const updateExamSchema = {
  title: { required: false, type: 'string', maxLength: 255, minLength: 1 },
  description: { required: false, type: 'string' },
  duration: { required: false, type: 'number', min: 1 },
  dueDate: { required: false, type: 'date' },
};

module.exports = { createExamSchema, updateExamSchema };