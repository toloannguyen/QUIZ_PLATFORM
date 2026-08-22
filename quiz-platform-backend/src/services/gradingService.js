const prisma = require('../utils/prismaClient');
const questionRepository = require('../repositories/questionRepository');
const { evaluateShortAnswer, evaluateEssayAnswer } = require('./aiEvaluationService');

const SCORE_BANDS = {
    'Very Good':          { min: 0.85, max: 1.00, threshold: 0.72, ceiling: 1.00 },
    'Partially Relevant': { min: 0.40, max: 0.70, threshold: 0.40, ceiling: 0.72 },
    'Not Related':        { min: 0.00, max: 0.15, threshold: 0.00, ceiling: 0.40 }
};

function calculateScoreFromLabel(label, similarityScore, maxScore) {
    const band = SCORE_BANDS[label];
    if (!band) return 0;

    const { threshold, ceiling, min, max } = band;

    const clampedSimilarity = Math.max(threshold, Math.min(ceiling, similarityScore));
    const normalizedInBand = ceiling > threshold
        ? (clampedSimilarity - threshold) / (ceiling - threshold)
        : 0;

    const ratio = min + normalizedInBand * (max - min);
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
        autoScore: calculateScoreFromLabel(aiResult.label, aiResult.similarity_score, question.maxScore),
        aiLabel: aiResult.label,
        aiSimilarity: aiResult.similarity_score,
        aiReason: aiResult.reason,
        aiReferenceInfo: null
    };
}

async function gradeEssay(question, answerText, courseId) {
    const aiResult = await evaluateEssayAnswer(answerText, courseId);

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
        autoScore: calculateScoreFromLabel(aiResult.label, aiResult.similarity_score, question.maxScore),
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
        const result = await gradeEssay(question, answerPayload.answerText, courseId);
        return {
            selectedOptionId: null,
            answerText: answerPayload.answerText,
            ...result
        };
    }

    throw new Error(`Loại câu hỏi không hợp lệ: ${question.type}`);
}

module.exports = {
    calculateScoreFromLabel,
    gradeMultipleChoice,
    gradeShortAnswer,
    gradeEssay,
    gradeAnswer
};