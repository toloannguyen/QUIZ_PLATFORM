import axiosClient from './axiosClient';

export function getLectures(params = {}) {
  const query = new URLSearchParams();

  if (params.courseId) {
    query.append('courseId', params.courseId);
  }

  const queryString = query.toString();
  return axiosClient.get(`/lectures${queryString ? `?${queryString}` : ''}`);
}

export function createLecture(data) {
  return axiosClient.post('/lectures', data);
}

export function updateLecture(id, data) {
  return axiosClient.patch(`/lectures/${id}`, data);
}

export function deleteLecture(id) {
  return axiosClient.delete(`/lectures/${id}`);
}
