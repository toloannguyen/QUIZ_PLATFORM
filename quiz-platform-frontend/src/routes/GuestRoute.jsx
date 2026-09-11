import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Dùng cho trang login/register — nếu đã đăng nhập rồi thì tự chuyển về trang chủ
 * thay vì cho xem lại form đăng nhập.
 */
export default function GuestRoute() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
