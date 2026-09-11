require('dotenv').config();
const express = require('express');
const path = require('path');
const prisma = require('./utils/prismaClient');

const app = express();
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const cors = require('cors');
app.use(cors());

const PORT = process.env.PORT || 5000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});


app.get('/health/db', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({ status: 'ok', message: 'Database connected', userCount });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

const { evaluateShortAnswer, evaluateEssayAnswer } = require('./services/aiEvaluationService');

const authRoutes = require('./routes/authRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const submissionReviewRoutes = require('./routes/submissionReviewRoutes');
const questionRoutes = require('./routes/questionRoutes');
const lectureRoutes = require('./routes/lectureRoutes');
const materialRoutes = require('./routes/materialRoutes');

const courseRoutes = require('./routes/courseRoutes');
app.use('/courses', courseRoutes);
app.use('/lectures', lectureRoutes);
app.use('/materials', materialRoutes);

const examRoutes = require('./routes/examRoutes');
app.use('/exams', examRoutes);
app.use('/questions', questionRoutes);

app.use('/auth', authRoutes);
app.use('/submissions', submissionRoutes);
app.use('/submissions', submissionReviewRoutes);

// Phải đặt SAU toàn bộ app.use(route) ở trên
const notFoundHandler = require('./middlewares/NotFoundHandler');
app.use(notFoundHandler);

// Phải đặt CUỐI CÙNG — Express nhận diện middleware 4 tham số là error handler
const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend server đang chạy tại http://localhost:${PORT}`);
});