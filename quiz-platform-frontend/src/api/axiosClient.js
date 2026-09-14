import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 90000,
});

// Tự động gắn JWT vào mọi request nếu đã đăng nhập — khớp với authMiddleware.js bên Backend
// (đọc header Authorization: Bearer <token>).
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Nếu Backend trả 401 (token hết hạn/không hợp lệ) — tự đăng xuất + về trang login.
// Không xử lý 403 ở đây vì 403 là "không đủ quyền" chứ không phải "chưa đăng nhập",
// nên để từng trang tự quyết định hiển thị gì (không nên tự động đá về login).
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
