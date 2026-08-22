const prisma = require('../utils/prismaClient');

async function createSubmission(examId, studentId) {
    return prisma.submission.create({
        data: {
            examId,
            studentId,
            status: 'PENDING',
            startedAt: new Date()
        }
    });
}

async function createSubmissionAnswer(data) {
    return prisma.submissionAnswer.create({ data });
}

async function updateSubmissionStatus(submissionId, status, autoScore) {
    return prisma.submission.update({
        where: { id: submissionId },
        data: { status, autoScore }
    });
}

async function getSubmissionWithAnswers(submissionId) {
    return prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
            answers: {
                include: { question: true }
            }
        }
    });
}

module.exports = {
    createSubmission,
    createSubmissionAnswer,
    updateSubmissionStatus,
    getSubmissionWithAnswers
};