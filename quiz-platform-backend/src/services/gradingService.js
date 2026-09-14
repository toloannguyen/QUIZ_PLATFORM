const prisma = require('../utils/prismaClient');
const questionRepository = require('../repositories/questionRepository');
const { evaluateShortAnswer, evaluateEssayAnswer } = require('./aiEvaluationService');

const CONFLICT_SAFETY_FLOOR_RATIO = 0.10;
const CONFLICT_SUSPICION_SIMILARITY = 0.50;

// Neo 2 đầu theo phân bố thực tế quan sát được (luồng essay, so với chunk dài):
// similarity <= LOW_ANCHOR  => gần như chắc chắn sai/lạc đề, cho gần 0 điểm
// similarity >= HIGH_ANCHOR => mức cao nhất thực tế đạt được cho câu đúng, cho gần điểm tối đa
// Ở giữa: nội suy tuyến tính, không có bước nhảy đột ngột (không còn hiệu ứng "vách đá").
const LOW_ANCHOR = 0.15;
const HIGH_ANCHOR = 0.80;

function calculateShortAnswerScore(similarityScore, maxScore) {
    const clamped = Math.max(0, Math.min(1, similarityScore ?? 0));
    return Math.round(clamped * maxScore * 100) / 100;
}

function calculateScore(label, similarityScore, maxScore) {
    const clamped = Math.max(0, Math.min(1, similarityScore ?? 0));

    if (label === 'Not Related' && clamped > CONFLICT_SUSPICION_SIMILARITY) {
        return Math.round(CONFLICT_SAFETY_FLOOR_RATIO * maxScore * 100) / 100;
    }

    const normalized = (clamped - LOW_ANCHOR) / (HIGH_ANCHOR - LOW_ANCHOR);
    const ratio = Math.max(0, Math.min(1, normalized));

    return Math.round(ratio * maxScore * 100) / 100;
}

async function gradeMultipleChoice(question, selectedOptionId) {
    if (!selectedOptionId) {
        return { autoScore: 0, selectedOptionId: null };
    }

    const option = await prisma.questionOption.findUnique({
        where: { id: selectedOptionId }
    });

    const autoScore = option && option.isCorrect ? question.maxScore : 0;
    return { autoScore, selectedOptionId };
}

async function gradeShortAnswer(question, answerText) {
    const aiResult = await evaluateShortAnswer(answerText, question.correctAnswer);

    if (aiResult.error) {
        return {
            autoScore: null,
            aiLabel: null,
            aiSimilarity: null,
            aiReason: aiResult.message,
            aiReferenceInfo: null
        };
    }

    return {
        autoScore: calculateShortAnswerScore(aiResult.similarity_score, question.maxScore),
        aiLabel: aiResult.label,
        aiSimilarity: aiResult.similarity_score,
        aiReason: aiResult.reason,
        aiReferenceInfo: null
    };
}

async function gradeEssay(question, questionText, answerText, courseId) {
    const aiResult = await evaluateEssayAnswer(questionText, answerText, courseId);

    if (aiResult.error) {
        return {
            autoScore: null,
            aiLabel: null,
            aiSimilarity: null,
            aiReason: aiResult.message,
            aiReferenceInfo: null
        };
    }

    return {
        autoScore: calculateScore(aiResult.label, aiResult.similarity_score, question.maxScore),
        aiLabel: aiResult.label,
        aiSimilarity: aiResult.similarity_score,
        aiReason: aiResult.reason,
        aiReferenceInfo: JSON.stringify({
            reference_chunks: aiResult.reference_chunks,
            primary_source: aiResult.primary_source
        })
    };
}

async function gradeAnswer(question, answerPayload) {
    if (question.type === 'MULTIPLE_CHOICE') {
        const result = await gradeMultipleChoice(question, answerPayload.selectedOptionId);
        return {
            selectedOptionId: result.selectedOptionId,
            answerText: null,
            autoScore: result.autoScore,
            aiLabel: null,
            aiSimilarity: null,
            aiReason: null,
            aiReferenceInfo: null
        };
    }

    if (question.type === 'SHORT_ANSWER') {
        const result = await gradeShortAnswer(question, answerPayload.answerText);
        return {
            selectedOptionId: null,
            answerText: answerPayload.answerText,
            ...result
        };
    }

    if (question.type === 'ESSAY') {
        const questionWithCourse = await questionRepository.getQuestionWithCourseInfo(question.id);
        const courseId = questionWithCourse.exam.courseId;
        const questionText = questionWithCourse.content; // ⚠️ đổi 'content' thành tên field thật trong schema.prisma nếu khác
        const result = await gradeEssay(question, questionText, answerPayload.answerText, courseId);
        return {
            selectedOptionId: null,
            answerText: answerPayload.answerText,
            ...result
        };
    }

    throw new Error(`Loại câu hỏi không hợp lệ: ${question.type}`);
}

module.exports = {
    calculateScore,
    gradeMultipleChoice,
    gradeShortAnswer,
    gradeEssay,
    gradeAnswer
};