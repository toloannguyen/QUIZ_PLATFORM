const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const materialRepository = require('../repositories/materialRepository');
const lectureRepository = require('../repositories/lectureRepository');
const courseRepository = require('../repositories/courseRepository');
const aiServiceClient = require('../utils/aiServiceClient');
const AppError = require('../utils/AppError');

/**
 * Gọi AI Service /upload-reference cho 1 file đã có sẵn trên đĩa.
 * Trả về { chunks_added } nếu thành công, throw nếu lỗi — caller tự quyết định
 * cách xử lý lỗi (không throw ra ngoài route, vì lỗi AI Service không nên chặn
 * việc quản lý Material ở tầng Backend).
 */
async function callAiUploadReference(filePath, fileName, courseId) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath), fileName);

  const response = await aiServiceClient.post(`/upload-reference?course_id=${courseId}`, form, {
    headers: form.getHeaders(),
  });

  return response.data; // { status, filename, chunks_added, total_in_collection }
}

/**
 * Upload Material mới:
 * 1. Kiểm tra lectureId thuộc đúng giáo viên (qua Lecture -> Course -> teacherId) —
 *    KHÔNG dùng requireOwner middleware vì Material chưa tồn tại lúc này, giống pattern Exam/Question.
 * 2. Tạo record Material trước (file vật lý đã được multer lưu sẵn trên đĩa).
 * 3. Gọi AI Service để xử lý PDF thành chunks — lỗi ở bước này KHÔNG throw ra ngoài,
 *    chỉ ghi nhận vào Material.aiError để giáo viên biết và có thể bấm "thử lại" sau
 *    (endpoint retryAiProcessing bên dưới), tránh việc 1 lần AI Service down làm mất
 *    luôn cả Material đã upload.
 */
function toPublicFileUrl(filePath) {
  return `/uploads/materials/${path.basename(filePath)}`;
}

function toDiskFilePath(fileUrl) {
  if (!fileUrl) return null;

  if (fileUrl.startsWith('/uploads/')) {
    return path.join(__dirname, '..', '..', fileUrl);
  }

  return fileUrl;
}

async function uploadMaterial({ title, lectureId, file }, user) {
  const lecture = await lectureRepository.findById(lectureId);
  if (!lecture) {
    throw new AppError('Bài giảng không tồn tại', 'lectureId', 404);
  }

  if (user.role !== 'ADMIN') {
    const course = await courseRepository.findById(lecture.courseId);
    if (!course || course.teacherId !== user.id) {
      throw new AppError('Bạn không phải chủ sở hữu khóa học này, không thể upload tài liệu', 'lectureId', 403);
    }
  }

  const material = await materialRepository.create({
    title,
    fileName: file.originalname,
    fileUrl: toPublicFileUrl(file.path),
    fileType: file.mimetype,
    lectureId,
  });

  try {
    const result = await callAiUploadReference(file.path, file.originalname, lecture.courseId);
    return materialRepository.updateAiStatus(material.id, {
      aiProcessed: true,
      aiChunkCount: result.chunks_added,
      aiError: null,
    });
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message || 'Lỗi không xác định khi gọi AI Service';
    return materialRepository.updateAiStatus(material.id, {
      aiProcessed: false,
      aiChunkCount: null,
      aiError: errorMessage,
    });
  }
}

async function listMaterials(lectureId) {
  if (!lectureId) {
    throw new AppError('Thiếu tham số lectureId', 'lectureId', 400);
  }
  return materialRepository.findByLectureId(lectureId);
}

async function getMaterialById(id) {
  const material = await materialRepository.findById(id);
  if (!material) {
    throw new AppError('Không tìm thấy tài liệu', null, 404);
  }
  return material;
}

/** Thử gọi lại AI Service cho file đã có sẵn — dùng khi lần upload trước aiError != null. */
async function retryAiProcessing(id) {
  const material = await getMaterialById(id);
  const courseId = await materialRepository.getCourseId(id);
  const absolutePath = toDiskFilePath(material.fileUrl);

  if (!absolutePath || !fs.existsSync(absolutePath)) {
    throw new AppError('File vật lý không còn tồn tại trên server, không thể thử lại', null, 404);
  }

  try {
    const result = await callAiUploadReference(absolutePath, material.fileName, courseId);
    return materialRepository.updateAiStatus(id, {
      aiProcessed: true,
      aiChunkCount: result.chunks_added,
      aiError: null,
    });
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message || 'Lỗi không xác định khi gọi AI Service';
    return materialRepository.updateAiStatus(id, {
      aiProcessed: false,
      aiChunkCount: null,
      aiError: errorMessage,
    });
  }
}

async function deleteMaterial(id) {
  const material = await getMaterialById(id);
  const absolutePath = toDiskFilePath(material.fileUrl);

  try {
    if (absolutePath && fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (_) {
    /* bỏ qua */
  }
  return materialRepository.remove(id);
}

module.exports = { uploadMaterial, listMaterials, getMaterialById, retryAiProcessing, deleteMaterial };