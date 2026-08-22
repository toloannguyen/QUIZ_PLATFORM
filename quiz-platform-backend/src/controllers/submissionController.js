const submissionService = require('../services/submissionService');

async function submitExam(req, res) {
    try {
        const { examId, studentId, answers } = req.body;

        if (!examId || !studentId || !Array.isArray(answers)) {
            return res.status(400).json({
                error: true,
                message: 'Thiếu examId, studentId, hoặc answers không hợp lệ'
            });
        }

        const result = await submissionService.submitExam(examId, studentId, answers);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            error: true,
            message: error.message
        });
    }
}

module.exports = { submitExam };