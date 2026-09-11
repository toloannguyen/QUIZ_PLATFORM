import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCourses } from '../api/courseApi';
import { getExams } from '../api/examApi';

export default function HomePage() {
  const { user, logout } = useAuth();
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [coursesRes, examsRes] = await Promise.all([getCourses(), getExams()]);
        setCourses(coursesRes.data || []);
        setExams(examsRes.data || []);
      } catch (error) {
        console.error('Load dashboard data failed', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const roleLabel = user?.role === 'TEACHER' ? 'Giáo viên' : user?.role === 'ADMIN' ? 'Quản trị' : 'Học viên';

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Quiz Platform</p>
            <h1 className="mt-1 text-xl font-bold text-slate-800">Dashboard</h1>
          </div>

          <nav className="flex items-center gap-4 text-sm text-slate-600">
            <Link to="/" className="font-medium text-blue-600">Trang chủ</Link>
            <Link to="/courses">Khóa học</Link>
            <Link to="/exams">Đề thi</Link>
            <Link to="/my-submissions">Lịch sử nộp</Link>
            <button
              onClick={logout}
              className="rounded bg-red-500 px-3 py-2 text-white hover:bg-red-600"
            >
              Đăng xuất
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow">
          <p className="text-sm uppercase tracking-[0.2em] text-blue-100">Xin chào</p>
          <h2 className="mt-2 text-3xl font-bold">{user?.name}</h2>
          <p className="mt-2 text-blue-50">{roleLabel} · {user?.email}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Tổng khóa học</p>
            <p className="mt-2 text-3xl font-bold text-slate-800">{loading ? '...' : courses.length}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Tổng đề thi</p>
            <p className="mt-2 text-3xl font-bold text-slate-800">{loading ? '...' : exams.length}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Vai trò</p>
            <p className="mt-2 text-2xl font-bold text-slate-800">{roleLabel}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Khóa học gần đây</h3>
              <Link to="/courses" className="text-sm font-medium text-blue-600">Xem tất cả</Link>
            </div>
            <div className="space-y-3">
              {courses.slice(0, 4).map((course) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="block rounded-lg border border-slate-200 p-3 hover:border-blue-300 hover:bg-blue-50"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-800">{course.title}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">#{course.id}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{course.description || 'Không có mô tả'}</p>
                </Link>
              ))}
              {!loading && courses.length === 0 && (
                <p className="text-sm text-slate-500">Chưa có khóa học nào.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Đề thi gần đây</h3>
              <Link to="/exams" className="text-sm font-medium text-blue-600">Xem tất cả</Link>
            </div>
            <div className="space-y-3">
              {exams.slice(0, 4).map((exam) => (
                <Link
                  key={exam.id}
                  to={`/exams/${exam.id}`}
                  className="block rounded-lg border border-slate-200 p-3 hover:border-indigo-300 hover:bg-indigo-50"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-800">{exam.title}</p>
                    <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs text-indigo-700">{exam.duration} phút</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {exam.description || 'Không có mô tả'}
                  </p>
                </Link>
              ))}
              {!loading && exams.length === 0 && (
                <p className="text-sm text-slate-500">Chưa có đề thi nào.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
