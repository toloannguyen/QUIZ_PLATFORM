import axiosClient from './axiosClient';

export function getExams(params = {}) {
  const query = new URLSearchParams();

  if (params.courseId) {
    query.append('courseId', params.courseId);
  }

  const queryString = query.toString();
  return axiosClient.get(`/exams${queryString ? `?${queryString}` : ''}`);
}

export function getExamById(id) {
  return axiosClient.get(`/exams/${id}`);
}

export function getExamTake(id) {
  return axiosClient.get(`/exams/${id}/take`);
}

export function createExam(data) {
  return axiosClient.post('/exams', data);
}

export function updateExam(id, data) {
  return axiosClient.patch(`/exams/${id}`, data);
}

export function deleteExam(id) {
  return axiosClient.delete(`/exams/${id}`);
}
