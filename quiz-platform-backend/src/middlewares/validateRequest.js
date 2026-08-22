/**
 * Validate req.body theo 1 schema đơn giản (không cần cài zod/express-validator).
 *
 * Schema là object dạng:
 *   {
 *     title: { required: true, type: 'string', maxLength: 255 },
 *     duration: { required: true, type: 'number', min: 1 },
 *     dueDate: { required: true, type: 'date' },
 *     type: { required: true, type: 'string', enum: ['A', 'B', 'C'] },
 *   }
 *
 * Hỗ trợ: required, type ('string' | 'number' | 'date' | 'boolean'),
 *         maxLength, minLength, min, max, enum (mảng giá trị hợp lệ — MỚI, thêm cho Question.type).
 *
 * Lỗi trả về field đầu tiên gặp lỗi (đồng bộ format với errorHandler),
 * kèm mảng `details` đầy đủ nếu frontend muốn hiển thị hết lỗi 1 lần.
 */
function validateRequest(schema) {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];
      const isEmpty = value === undefined || value === null || value === '';

      if (rules.required && isEmpty) {
        errors.push({ field, message: `${field} là bắt buộc` });
        continue;
      }

      if (isEmpty) continue;

      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push({ field, message: `${field} phải là chuỗi ký tự` });
      } else if (rules.type === 'number' && typeof value !== 'number') {
        errors.push({ field, message: `${field} phải là số` });
      } else if (rules.type === 'boolean' && typeof value !== 'boolean') {
        errors.push({ field, message: `${field} phải là true/false` });
      } else if (rules.type === 'date' && isNaN(Date.parse(value))) {
        errors.push({ field, message: `${field} phải là ngày hợp lệ (ISO string)` });
      }

      if (rules.type === 'string' && typeof value === 'string') {
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push({ field, message: `${field} không được vượt quá ${rules.maxLength} ký tự` });
        }
        if (rules.minLength && value.length < rules.minLength) {
          errors.push({ field, message: `${field} phải có ít nhất ${rules.minLength} ký tự` });
        }
      }

      if (rules.type === 'number' && typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push({ field, message: `${field} phải >= ${rules.min}` });
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push({ field, message: `${field} phải <= ${rules.max}` });
        }
      }

      if (rules.enum && !rules.enum.includes(value)) {
        errors.push({ field, message: `${field} phải là một trong: ${rules.enum.join(', ')}` });
      }
    }

    if (errors.length > 0) {
      return res.status(422).json({
        error: true,
        field: errors[0].field,
        message: errors[0].message,
        details: errors,
      });
    }

    return next();
  };
}

module.exports = validateRequest;