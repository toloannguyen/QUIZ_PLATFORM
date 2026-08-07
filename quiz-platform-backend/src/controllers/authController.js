const authService = require('../services/authService');
const catchAsync = require('../utils/catchAsync');

const register = catchAsync(async (req, res, next) => {
  // Giao toàn bộ data cho Service xử lý
  const result = await authService.registerUser(req.body);

  // Trả kết quả thành công (201 Created)
  res.status(201).json({
    status: 'success',
    data: result,
  });
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Yêu cầu nhập đủ
  if (!email || !password) {
    return res.status(400).json({
      status: 'fail',
      message: 'Vui lòng cung cấp email và mật khẩu!',
    });
  }

  const result = await authService.loginUser(email, password);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

module.exports = {
  register,
  login,
};