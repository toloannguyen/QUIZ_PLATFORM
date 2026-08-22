const aiServiceClient = require('../utils/aiServiceClient');

async function evaluateShortAnswer(studentAnswer, referenceAnswer) {
    try {
        const response = await aiServiceClient.post('/evaluate', {
            student_answer: studentAnswer,
            reference_answer: referenceAnswer,
            mode: 'short_answer'
        });
        return response.data;
    } catch (error) {
        return handleAIServiceError(error);
    }
}

async function evaluateEssayAnswer(studentAnswer, courseId) {
    try {
        const response = await aiServiceClient.post('/evaluate', {
            student_answer: studentAnswer,
            course_id: courseId,
            mode: 'essay'
        });
        return response.data;
    } catch (error) {
        return handleAIServiceError(error);
    }
}

function handleAIServiceError(error) {
    if (error.code === 'ECONNABORTED') {
        return {
            label: null,
            similarity_score: null,
            error: true,
            message: 'AI Service phản hồi quá lâu (timeout)'
        };
    }

    if (error.response) {
        return {
            label: null,
            similarity_score: null,
            error: true,
            message: error.response.data.message || 'Lỗi từ AI Service'
        };
    }

    return {
        label: null,
        similarity_score: null,
        error: true,
        message: 'Không thể kết nối tới AI Service'
    };
}

module.exports = {
    evaluateShortAnswer,
    evaluateEssayAnswer
};