const prisma = require('../utils/prismaClient');
const submissionRepository = require('../repositories/submissionRepository');
const { gradeAnswer } = require('./gradingService');

async function submitExam(examId, studentId, answersPayload) {
    const submission = await submissionRepository.createSubmission(examId, studentId);

    let totalScore = 0;
    let hasGradingError = false;
    const gradedAnswers = [];

    for (const answerItem of answersPayload) {
        const question = await prisma.question.findUnique({
            where: { id: answerItem.questionId }
        });

        if (!question) continue;

        const graded = await gradeAnswer(question, answerItem);

        if (graded.autoScore === null) {
            hasGradingError = true;
        } else {
            totalScore += graded.autoScore;
        }

        const savedAnswer = await submissionRepository.createSubmissionAnswer({
            submissionId: submission.id,
            questionId: question.id,
            ...graded
        });

        gradedAnswers.push(savedAnswer);
    }

    const finalStatus = hasGradingError ? 'PENDING' : 'AUTO_GRADED';
    await submissionRepository.updateSubmissionStatus(submission.id, finalStatus, totalScore);

    return {
        submissionId: submission.id,
        status: finalStatus,
        totalScore,
        answers: gradedAnswers
    };
}

module.exports = {
    submitExam
};