const catchAsync = (fn) => {
  return (req, res, next) => {
    // Nếu hàm fn xảy ra Promise Reject / Error, catch() sẽ chuyển lỗi thẳng sang next()
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;