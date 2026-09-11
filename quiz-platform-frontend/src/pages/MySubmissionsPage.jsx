import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMySubmissions } from '../api/submissionApi';

export default function MySubmissionsPage() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMySubmissions();
        setSubs(res.data || []);
      } catch (e) {
        setSubs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Lịch sử</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-800">Lịch sử nộp bài của bạn</h1>
          </div>
          <Link to="/" className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900">Quay lại</Link>
        </div>

        <div className="space-y-3">
          {loading && <div className="text-slate-500">Đang tải...</div>}
          {!loading && subs.length === 0 && (
            <div className="rounded border border-slate-200 bg-white p-4 text-sm text-slate-500">Bạn chưa có bài nộp nào.</div>
          )}

          {subs.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded border border-slate-200 bg-white p-4">
              <div>
                <div className="font-medium text-slate-800">{s.exam?.title || 'Đề thi'}</div>
                <div className="text-xs text-slate-500">{new Date(s.submittedAt || s.startedAt).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{Number(s.autoScore ?? s.finalScore ?? s.totalScore ?? 0).toFixed(2)} điểm</div>
                <div className="text-xs text-slate-500">{s.status}</div>
                <Link to={`/submissions/${s.id}`} className="mt-2 inline-block text-sm text-blue-600">Xem chi tiết</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
