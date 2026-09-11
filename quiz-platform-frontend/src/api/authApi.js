import axiosClient from './axiosClient';

export function register(data) {
  // data: { name, email, password, role }
  return axiosClient.post('/auth/register', data);
}

export function login(data) {
  // data: { email, password }
  return axiosClient.post('/auth/login', data);
}
