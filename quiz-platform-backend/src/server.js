const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load các biến từ file .env

const AppError = require('./utils/AppError');
const globalErrorHandler = require('./controllers/errorController');

// 2.2.1 Import Routes
const authRoutes = require('./routes/authRoutes');

// 2.3.1 Ngay dưới dòng import authRoutes
const courseRoutes = require('./routes/courseRoutes');
// 2.4.1
const examRoutes = require('./routes/examRoutes');
// 2.5.1
const submissionRoutes = require('./routes/submissionRoutes');

// 2.1.1. Bắt các lỗi Synchronous bất ngờ (Uncaught Exceptions) - Phải đặt trước toàn bộ code
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Đang tắt server...');
  console.error(err.name, err.message);
  process.exit(1);
});
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Giúp server đọc được dữ liệu dạng JSON do frontend gửi lên

// 2.2.2 GẮN ROUTE VÀO ĐÂY
app.use('/api/v1/auth', authRoutes);
// 2.3.2 
app.use('/api/v1/courses', courseRoutes);
// 2.4.2
app.use('/api/v1/exams', examRoutes);
// 2.5.2
app.use('/api/v1/submissions', submissionRoutes);


// Route test cơ bản
app.get('/', (req, res) => {
    res.send('Quiz Platform API is running!');
});

// 2.1.2. Bắt các đường dẫn không tồn tại (404 Not Found)
app.use((req, res, next) => {
  next(new AppError(`Không tìm thấy đường dẫn ${req.originalUrl} trên server!`, 404));
});

// 2.1.3. Global Error Handling Middleware (Phải đặt ở CUỐI CÙNG sau các routes)
app.use(globalErrorHandler);

// Định nghĩa port (lấy từ .env, nếu không có thì mặc định là 5000)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

// 2.1.4. Bắt các lỗi Asynchronous không được catch (Unhandled Rejections)
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Đang đóng server...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});