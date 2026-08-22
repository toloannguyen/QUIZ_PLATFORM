const createCourseSchema = {
  title: { required: true, type: 'string', maxLength: 255, minLength: 1 },
  description: { required: false, type: 'string' },
};

const updateCourseSchema = {
  title: { required: false, type: 'string', maxLength: 255, minLength: 1 },
  description: { required: false, type: 'string' },
};

module.exports = { createCourseSchema, updateCourseSchema };