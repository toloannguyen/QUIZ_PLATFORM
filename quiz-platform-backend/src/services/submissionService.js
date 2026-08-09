const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/AppError');

const prisma = new PrismaClient();

// 1. Sinh viên bắt đầu làm bài
const startExam = async (studentId, examId) => {
  // Kiểm tra đề thi có tồn tại không
  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) throw new AppError('Không tìm thấy đề thi!', 404);

  // Kiểm tra xem sinh viên có đang làm dở bài này không
  const existingSubmission = await prisma.submission.findFirst({
    where: { examId, studentId, status: 'PENDING' }
  });
  
  // Nếu đang làm dở thì trả về luôn phiên cũ (để đề phòng rớt mạng load lại trang)
  if (existingSubmission) return existingSubmission;

  // Tạo phiên làm bài mới
  const newSubmission = await prisma.submission.create({
    data: {
      examId,
      studentId,
      startedAt: new Date(),
      status: 'PENDING'
    }
  });

  return newSubmission;
};

// 2. Sinh viên nộp bài & Hệ thống tự động chấm điểm
const submitExam = async (studentId, examId, data) => {
  const { answers } = data; // Dữ liệu FE gửi lên: [{ questionId: 1, selectedOptionId: 3 }, ...]

  // Tìm phiên làm bài đang PENDING của sinh viên này
  const submission = await prisma.submission.findFirst({
    where: { examId, studentId, status: 'PENDING' }
  });

  if (!submission) {
    throw new AppError('Không tìm thấy phiên làm bài hợp lệ hoặc bạn đã nộp bài rồi!', 400);
  }

  // BẢO MẬT: Lấy danh sách câu hỏi và CHỈ lấy các đáp án ĐÚNG từ Database
  const questions = await prisma.question.findMany({
    where: { examId },
    include: {
      options: { where: { isCorrect: true } }
    }
  });

  let totalScore = 0;
  const submissionAnswersData = []; // Mảng chứa dữ liệu để Nested Write

  // Vòng lặp chấm điểm từng câu
  for (const ans of answers) {
    const question = questions.find((q) => q.id === ans.questionId);
    if (!question) continue;

    let earnedScore = 0;

    // Logic chấm điểm trắc nghiệm (MULTIPLE_CHOICE)
    if (question.type === 'MULTIPLE_CHOICE' && question.options.length > 0) {
      const correctOptionId = question.options[0].id; // ID của đáp án đúng
      
      if (correctOptionId === ans.selectedOptionId) {
        earnedScore = question.maxScore; // Cộng điểm nếu chọn đúng
        totalScore += earnedScore;
      }
    }

    // Đẩy vào mảng chuẩn bị lưu xuống DB
    submissionAnswersData.push({
      questionId: ans.questionId,
      selectedOptionId: ans.selectedOptionId,
      autoScore: earnedScore
    });
  }

  // Cập nhật trạng thái bài thi và lưu chi tiết từng câu trả lời cùng lúc
  const updatedSubmission = await prisma.submission.update({
    where: { id: submission.id },
    data: {
      status: 'COMPLETED',
      submittedAt: new Date(),
      autoScore: totalScore,
      finalScore: totalScore, // Có thể cộng thêm điểm tự luận sau này
      answers: {
        create: submissionAnswersData // Nested Writes: Tạo danh sách SubmissionAnswer
      }
    },
    include: {
      answers: true // Trả về kết quả chi tiết để Client xem lại
    }
  });

  return updatedSubmission;
};

module.exports = {
  startExam,
  submitExam
};