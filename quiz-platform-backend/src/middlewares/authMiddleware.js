const jwt = require('jsonwebtoken');

/**
 * Xác thực JWT từ header Authorization: Bearer <token>.
 * Nếu hợp lệ, gắn req.user = { id, role, email } cho controller/service phía sau dùng.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: true,
      field: null,
      message: 'Thiếu token xác thực',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, email, iat, exp }
    return next();
  } catch (err) {
    return res.status(401).json({
      error: true,
      field: null,
      message: 'Token không hợp lệ hoặc đã hết hạn',
    });
  }
}

module.exports = authenticate;