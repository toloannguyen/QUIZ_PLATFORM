const materialService = require('../services/materialService');

/**
 * KHÔNG dùng validateRequest middleware cho route này — vì multipart/form-data
 * khiến mọi field text (title, lectureId) đến dưới dạng STRING trong req.body
 * (kể cả lectureId), trong khi validateRequest.type:'number' sẽ luôn fail với string.
 * Validate thủ công ở đây, tự ép kiểu trước khi so sánh.
 */
async function upload(req, res) {
  if (!req.file) {
    return res.status(400).json({
      error: true,
      field: 'file',
      message: 'Thiếu file hoặc file không phải PDF',
    });
  }

  const title = req.body.title;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: true, field: 'title', message: 'title là bắt buộc' });
  }

  const lectureId = Number(req.body.lectureId);
  if (!req.body.lectureId || Number.isNaN(lectureId)) {
    return res.status(400).json({ error: true, field: 'lectureId', message: 'lectureId phải là số hợp lệ' });
  }

  const material = await materialService.uploadMaterial({ title, lectureId, file: req.file }, req.user);
  res.status(201).json(material);
}

async function list(req, res) {
  const materials = await materialService.listMaterials(req.query.lectureId);
  res.json(materials);
}

async function getOne(req, res) {
  const material = await materialService.getMaterialById(req.params.id);
  res.json(material);
}

async function retry(req, res) {
  const material = await materialService.retryAiProcessing(req.params.id);
  res.json(material);
}

async function remove(req, res) {
  await materialService.deleteMaterial(req.params.id);
  res.status(204).send();
}

module.exports = { upload, list, getOne, retry, remove };