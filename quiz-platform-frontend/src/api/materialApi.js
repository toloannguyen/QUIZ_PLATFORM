import axiosClient from './axiosClient';

export function getMaterialsByLecture(lectureId) {
  return axiosClient.get(`/materials?lectureId=${lectureId}`);
}

export function uploadMaterial({ lectureId, title, file }) {
  const formData = new FormData();
  formData.append('lectureId', String(lectureId));
  formData.append('title', title);
  formData.append('file', file);

  return axiosClient.post('/materials/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export function retryMaterialAi(id) {
  return axiosClient.post(`/materials/${id}/retry`);
}

export function deleteMaterial(id) {
  return axiosClient.delete(`/materials/${id}`);
}
