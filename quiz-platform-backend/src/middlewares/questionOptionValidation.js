const createOptionSchema = {
  optionText: { required: true, type: 'string', minLength: 1 },
  isCorrect: { required: false, type: 'boolean' },
};

const updateOptionSchema = {
  optionText: { required: false, type: 'string', minLength: 1 },
  isCorrect: { required: false, type: 'boolean' },
};

module.exports = { createOptionSchema, updateOptionSchema };