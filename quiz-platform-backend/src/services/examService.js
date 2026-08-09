const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/AppError');

const prisma = new PrismaClient();

// 1. Tạo đề thi mới
const createExam = async (teacherId, data) => {
  const { courseId, title, description, duration, dueDate } = data;

  // Kiểm tra xem khóa học có thuộc về giáo viên này không
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new AppError('Không tìm thấy khóa học!', 404);
  if (course.teacherId !== teacherId) throw new AppError('Bạn không có quyền thêm đề thi vào khóa học này!', 403);

  const newExam = await prisma.exam.create({
    data: {
      title,
      description,
      duration,
      dueDate: new Date(dueDate), // Chuyển chuỗi ngày tháng từ client thành object Date
      teacherId,
      courseId,
    },
  });

  return newExam;
};

// 2. Thêm câu hỏi và đáp án vào đề thi (Sử dụng Nested Writes)
const createQuestion = async (teacherId, examId, data) => {
  const { type, content, maxScore, orderNumber, part, options } = data;

  // Kiểm tra quyền sở hữu đề thi
  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) throw new AppError('Không tìm thấy đề thi!', 404);
  if (exam.teacherId !== teacherId) throw new AppError('Bạn không có quyền sửa đề thi này!', 403);

  // Tạo Câu hỏi VÀ Các lựa chọn (Options) cùng một lúc
  const newQuestion = await prisma.question.create({
    data: {
      examId,
      type, // Ví dụ: 'MULTIPLE_CHOICE'
      content,
      maxScore,
      orderNumber: orderNumber || 1,
      part: part || 1,
      // Nested write: Tạo các bản ghi QuestionOption gắn liền với Question này
      options: {
        create: options, 
      },
    },
    // Include để kết quả trả về hiển thị luôn cả mảng options vừa tạo
    include: {
      options: true,
    },
  });

  return newQuestion;
};

// phase 5: Lấy chi tiết đề thi kèm câu hỏi (Bảo mật đáp án)
const getExamById = async (examId) => {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      questions: {
        include: {
          // BẢO MẬT: Dùng 'select' thay vì 'include: true' để chỉ lấy các trường an toàn
          options: {
            select: {
              id: true,
              optionText: true,
              // Cố tình bỏ qua trường isCorrect để Frontend không bao giờ thấy được
            }
          }
        }
      }
    }
  });

  if (!exam) throw new AppError('Không tìm thấy đề thi!', 404);

  return exam;
};
module.exports = {
  createExam,
  createQuestion,
  getExamById, // Thêm dòng này
};