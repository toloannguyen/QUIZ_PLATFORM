const authService = require('../services/authService');

async function register(req, res) {
  try {
    // CỐ TÌNH không lấy req.body.role — dù client có gửi lên cũng bị bỏ qua hoàn toàn.
    // authService.register() hard-code role='STUDENT', xem giải thích trong file đó.
    const { name, email, password } = req.body;
    const { user, token } = await authService.register({ name, email, password });
    return res.status(201).json({ user, token });
  } catch (err) {
    return handleAuthError(err, res);
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login({ email, password });
    return res.status(200).json({ user, token });
  } catch (err) {
    return handleAuthError(err, res);
  }
}

function handleAuthError(err, res) {
  if (err instanceof authService.AuthError) {
    return res.status(err.statusCode).json({
      error: true,
      field: err.field,
      message: err.message,
    });
  }
  console.error('[Auth] Lỗi không xác định:', err);
  return res.status(500).json({
    error: true,
    field: null,
    message: 'Lỗi hệ thống, vui lòng thử lại sau',
  });
}

module.exports = { register, login };