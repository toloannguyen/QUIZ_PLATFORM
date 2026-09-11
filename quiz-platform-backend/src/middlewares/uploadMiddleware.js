const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Lưu file vật lý ở đây — Backend giữ 1 bản để sau này có thể tải lại/xóa,
// đồng thời forward chính file này sang AI Service để xử lý thành chunks.
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'materials');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

/**
 * Chỉ nhận PDF — nếu sai loại, KHÔNG throw Error ở đây (multer xử lý throw khá lằng nhằng
 * qua error middleware), thay vào đó cb(null, false) để req.file = undefined, rồi controller
 * tự trả lỗi 400 rõ ràng.
 */
function fileFilter(req, file, cb) {
  if (file.mimetype !== 'application/pdf') {
    return cb(null, false);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB — khớp giới hạn AI Service (mục 7 tài liệu handoff)
});

module.exports = upload;