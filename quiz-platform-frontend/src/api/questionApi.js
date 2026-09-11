import axiosClient from './axiosClient';

export function getQuestionsByExam(examId) {
  return axiosClient.get(`/questions?examId=${examId}`);
}

export function createQuestion(data) {
  return axiosClient.post('/questions', data);
}

export function updateQuestion(id, data) {
  return axiosClient.patch(`/questions/${id}`, data);
}

export function deleteQuestion(id) {
  return axiosClient.delete(`/questions/${id}`);
}
