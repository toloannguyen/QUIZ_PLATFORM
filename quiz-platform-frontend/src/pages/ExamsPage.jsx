import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getExams, createExam, deleteExam } from '../api/examApi';

const EMPTY_FORM = {
  title: '',
  description: '',
  duration: 60,
  dueDate: '',
  courseId: '',
};

export default function ExamsPage() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  async function loadExams() {
    try {
      const res = await getExams();
      setExams(res.data || []);
    } catch (err) {
      setError('Không tải được danh sách đề thi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExams();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');

    try {
      await createExam({
        ...form,
        duration: Number(form.duration),
        courseId: Number(form.courseId),
      });
      setForm(EMPTY_FORM);
      await loadExams();
    } catch (err) {
      setError(err.response?.data?.message || 'Tạo đề thi thất bại');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Bạn có chắc muốn xóa đề thi này?')) return;

    try {
      await deleteExam(id);
      await loadExams();
    } catch (err) {
      setError(err.response?.data?.message || 'Xóa đề thi thất bại');
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Đề thi</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-800">Quản lý đề thi</h1>
          </div>
          <Link to="/" className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Về dashboard
          </Link>
        </div>

        {user?.role === 'TEACHER' || user?.role === 'ADMIN' ? (
          <form onSubmit={handleCreate} className="mb-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Tạo đề thi mới</h2>
            {error && <div className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Tiêu đề</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Thời lượng (phút)</label>
                <input
                  name="duration"
                  type="number"
                  min="1"
                  value={form.duration}
                  onChange={handleChange}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Khóa học ID</label>
                <input
                  name="courseId"
                  type="number"
                  value={form.courseId}
                  onChange={handleChange}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Hạn nộp</label>
                <input
                  name="dueDate"
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={handleChange}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">Mô tả</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="3"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <button type="submit" className="mt-4 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Tạo đề thi
            </button>
          </form>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <p className="text-sm text-slate-500">Đang tải...</p>
          ) : exams.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có đề thi nào.</p>
          ) : (
            exams.map((exam) => (
              <div key={exam.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400"># {exam.id}</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-800">{exam.title}</h3>
                  </div>
                  <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">{exam.duration}m</span>
                </div>

                <p className="mt-3 text-sm text-slate-600">{exam.description || 'Không có mô tả'}</p>
                <p className="mt-2 text-xs text-slate-500">Hạn nộp: {exam.dueDate ? new Date(exam.dueDate).toLocaleString('vi-VN') : 'N/A'}</p>

                <div className="mt-5 flex gap-2">
                  <Link to={`/exams/${exam.id}`} className="rounded bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-900">
                    Chi tiết
                  </Link>
                  <button
                    onClick={() => handleDelete(exam.id)}
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
