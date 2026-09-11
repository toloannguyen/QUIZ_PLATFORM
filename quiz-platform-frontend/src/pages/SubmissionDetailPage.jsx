import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSubmissionDetail } from '../api/submissionApi';

export default function SubmissionDetailPage() {
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getSubmissionDetail(id);
        setSubmission(res.data);
      } catch (e) {
        setSubmission(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="p-6 text-slate-500">Đang tải...</div>;
  if (!submission) return <div className="p-6 text-red-500">Không tìm thấy bài nộp.</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Chi tiết bài nộp</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-800">{submission.exam?.title || 'Đề thi'}</h1>
            <p className="text-xs text-slate-500">{new Date(submission.submittedAt || submission.startedAt).toLocaleString()}</p>
          </div>
          <Link to="/my-submissions" className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900">Quay lại</Link>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Trạng thái</p>
              <p className="font-semibold">{submission.status}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Tổng điểm</p>
              <p className="font-semibold text-lg">{Number(submission.finalScore ?? submission.autoScore ?? 0).toFixed(2)}</p>
            </div>
          </div>

          <div className="space-y-3">
            {submission.answers.map((a, idx) => (
              <div key={a.id} className="rounded border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Câu {idx + 1}: {a.question?.title || ''}</div>
                  <div className="text-sm font-semibold">{Number(a.teacherScore ?? a.autoScore ?? 0).toFixed(2)} / {a.question?.maxScore ?? 0}</div>
                </div>
                <div className="mt-2 text-sm text-slate-700 whitespace-pre-line">{a.answerText}</div>
                {a.aiLabel && <div className="mt-2 text-xs text-slate-600">AI: {a.aiLabel}</div>}
                {a.aiSimilarity !== null && a.aiSimilarity !== undefined && (
                  <div className="mt-1 text-xs text-slate-600">Độ tương đồng: {(Number(a.aiSimilarity) * 100).toFixed(1)}%</div>
                )}
                {(() => {
                  const skipMsg = 'Lớp kiểm tra phủ định không áp dụng cho tài liệu dài (độ tin cậy thấp)';
                  const cleaned = a.aiReason ? String(a.aiReason).replace(skipMsg, '').trim() : '';
                  return cleaned ? <div className="mt-2 text-xs text-slate-600">Lý do: {cleaned}</div> : null;
                })()}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
