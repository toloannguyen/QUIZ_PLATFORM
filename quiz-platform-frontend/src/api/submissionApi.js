import axiosClient from './axiosClient';

export function submitExam(payload) {
  return axiosClient.post('/submissions/submit', payload);
}

export function getSubmissionDetail(id) {
  return axiosClient.get(`/submissions/${id}`);
}

export function getMySubmissions() {
  return axiosClient.get('/submissions/my');
}
