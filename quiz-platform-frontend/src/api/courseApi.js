import axiosClient from './axiosClient';

export function getCourses() {
  return axiosClient.get('/courses');
}

export function getCourseById(id) {
  return axiosClient.get(`/courses/${id}`);
}

export function createCourse(data) {
  return axiosClient.post('/courses', data);
}

export function updateCourse(id, data) {
  return axiosClient.patch(`/courses/${id}`, data);
}

export function deleteCourse(id) {
  return axiosClient.delete(`/courses/${id}`);
}
