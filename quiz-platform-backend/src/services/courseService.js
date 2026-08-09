const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/AppError');

const prisma = new PrismaClient();

// 1. Tạo khóa học mới (Dành cho Giáo viên)
const createCourse = async (teacherId, data) => {
  const { title, description } = data;

  const newCourse = await prisma.course.create({
    data: {
      title,
      description,
      teacherId, // Lấy ID giáo viên từ token gán vào đây
    },
  });

  return newCourse;
};

// 2. Lấy danh sách toàn bộ khóa học (Dành cho Sinh viên/Giáo viên)
const getAllCourses = async () => {
  const courses = await prisma.course.findMany({
    // Lấy kèm thông tin giáo viên và danh sách bài giảng (JOIN bảng)
    include: {
      teacher: {
        select: { id: true, name: true, email: true }, // Chỉ lấy các trường cần thiết, bỏ password
      },
      lectures: {
        select: { id: true, title: true }, // Chỉ lấy tựa đề bài giảng cho gọn nhẹ
      },
    },
  });
  return courses;
};

// 3. Thêm bài giảng vào khóa học
const createLecture = async (teacherId, courseId, data) => {
  const { title, description } = data;

  // Kiểm tra xem khóa học có tồn tại và giáo viên này có phải là chủ sở hữu không
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  
  if (!course) {
    throw new AppError('Không tìm thấy khóa học này!', 404);
  }
  
  if (course.teacherId !== teacherId) {
    throw new AppError('Bạn không có quyền thêm bài giảng vào khóa học của người khác!', 403);
  }

  // Tạo bài giảng mới
  const newLecture = await prisma.lecture.create({
    data: {
      title,
      description,
      courseId,
    },
  });

  return newLecture;
};

module.exports = {
  createCourse,
  getAllCourses,
  createLecture,
};