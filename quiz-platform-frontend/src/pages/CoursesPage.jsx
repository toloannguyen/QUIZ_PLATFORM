import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCourses, createCourse, deleteCourse } from '../api/courseApi';

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  async function loadCourses() {
    try {
      const res = await getCourses();
      setCourses(res.data || []);
    } catch (err) {
      setError('Không tải được danh sách khóa học');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');

    try {
      await createCourse({ title, description });
      setTitle('');
      setDescription('');
      await loadCourses();
    } catch (err) {
      setError(err.response?.data?.message || 'Tạo khóa học thất bại');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Bạn có chắc muốn xóa khóa học này?')) return;

    try {
      await deleteCourse(id);
      await loadCourses();
    } catch (err) {
      setError(err.response?.data?.message || 'Xóa khóa học thất bại');
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Khóa học</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-800">Quản lý khóa học</h1>
          </div>
          <Link to="/" className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Về dashboard
          </Link>
        </div>

        {user?.role === 'TEACHER' || user?.role === 'ADMIN' ? (
          <form onSubmit={handleCreate} className="mb-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Tạo khóa học mới</h2>
            {error && <div className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Tiêu đề</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Ví dụ: Toán cao cấp"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Mô tả</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Mô tả khóa học"
                />
              </div>
            </div>

            <button type="submit" className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Tạo khóa học
            </button>
          </form>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <p className="text-sm text-slate-500">Đang tải...</p>
          ) : courses.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có khóa học nào.</p>
          ) : (
            courses.map((course) => (
              <div key={course.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400"># {course.id}</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-800">{course.title}</h3>
                  </div>
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">Khóa học</span>
                </div>

                <p className="mt-3 text-sm text-slate-600">{course.description || 'Không có mô tả'}</p>

                <div className="mt-5 flex gap-2">
                  <Link to={`/courses/${course.id}`} className="rounded bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-900">
                    Chi tiết
                  </Link>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="rounded bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
