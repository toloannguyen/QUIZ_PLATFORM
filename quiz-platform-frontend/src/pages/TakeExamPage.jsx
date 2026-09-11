import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getExamTake } from '../api/examApi';
import { submitExam, getMySubmissions } from '../api/submissionApi';

export default function TakeExamPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadExam() {
      try {
        const res = await getExamTake(id);
        setExam(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể tải đề thi');
      } finally {
        setLoading(false);
      }
    }

    loadExam();
    // load user's submission history
    (async () => {
      try {
        const h = await getMySubmissions();
        setHistory(h.data || []);
      } catch (e) {
        // ignore errors – history is optional
      }
    })();
  }, [id]);

  const sortedQuestions = useMemo(() => {
    if (!exam?.questions) return [];
    return [...exam.questions].sort((a, b) => a.part - b.part || a.orderNumber - b.orderNumber);
  }, [exam]);

  function updateAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!user?.id) {
      setError('Bạn cần đăng nhập để nộp bài');
      return;
    }

    const payload = sortedQuestions.map((question) => {
      const answer = answers[question.id];

      if (question.type === 'MULTIPLE_CHOICE') {
        return {
          questionId: question.id,
          selectedOptionId: answer || null,
        };
      }

      return {
        questionId: question.id,
        answerText: answer || '',
      };
    });

    try {
      setSubmitting(true);
      setError('');
      const res = await submitExam({ examId: Number(id), studentId: Number(user.id), answers: payload });
      setResult(res.data);
      // refresh history after successful submit
      try {
        const h = await getMySubmissions();
        setHistory(h.data || []);
      } catch (e) {
        // ignore
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Nộp bài thất bại');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-slate-500">Đang tải đề thi...</div>;
  }

  if (!exam) {
    return <div className="p-6 text-red-500">{error || 'Không tìm thấy đề thi.'}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Làm bài</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-800">{exam.title}</h1>
          </div>
          <Link to={`/exams/${id}`} className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900">
            Quay lại
          </Link>
        </div>

        {error && <div className="mb-5 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

        {result && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
            <p className="font-semibold">Nộp bài thành công</p>
            <p className="mt-1 text-sm">Submission ID: {result.submissionId}</p>
            <p className="text-sm">Status: {result.status}</p>

            {/* Group answers by part and show per-part subtotals */}
            <div className="mt-4 space-y-4">
              {(() => {
                const byPart = {};
                (result.answers || []).forEach((answer) => {
                  const question = sortedQuestions.find((item) => item.id === answer.questionId) || {};
                  const part = question.part || 1;
                  if (!byPart[part]) byPart[part] = { questions: [], subtotal: 0 };
                  byPart[part].questions.push({ answer, question });
                  const score = Number(answer.autoScore ?? 0);
                  byPart[part].subtotal += score;
                });

                const parts = Object.keys(byPart)
                  .map((p) => Number(p))
                  .sort((a, b) => a - b);

                return parts.map((part) => (
                  <div key={`part-${part}`} className="rounded-lg border border-green-200 bg-white p-3 text-sm text-slate-700">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-800">Phần {part}</p>
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                        Tổng phần: {Number(byPart[part].subtotal ?? 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="mt-3 space-y-3">
                      {byPart[part].questions.map(({ answer, question }, qIndex) => {
                        const maxScore = question?.maxScore ?? 0;
                        const scoreText = `${Number(answer.autoScore ?? 0).toFixed(2)} / ${maxScore}`;
                        return (
                          <div key={answer.id || `${answer.questionId}-${qIndex}`} className="rounded border border-slate-100 bg-slate-50 p-3">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-slate-800">Câu {question.orderNumber || qIndex + 1}</p>
                              <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">{scoreText}</span>
                            </div>

                            {answer.aiLabel && (
                              <p className="mt-2">AI: <span className="font-medium">{answer.aiLabel}</span></p>
                            )}

                            {answer.aiSimilarity !== null && answer.aiSimilarity !== undefined && (
                              <p className="mt-1 text-xs text-slate-600">Độ tương đồng: {(Number(answer.aiSimilarity) * 100).toFixed(1)}%</p>
                            )}

                            {(() => {
                              const skipMsg = 'Lớp kiểm tra phủ định không áp dụng cho tài liệu dài (độ tin cậy thấp)';
                              const cleaned = answer.aiReason ? String(answer.aiReason).replace(skipMsg, '').trim() : '';
                              return cleaned ? (
                                <p className="mt-2 rounded bg-white p-2 text-xs text-slate-600">{cleaned}</p>
                              ) : null;
                            })()}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}

              <div className="mt-2 flex items-center justify-end">
                <p className="text-sm font-semibold">Tổng (AI tổng hợp): <span className="ml-2 text-lg">{Number(result.totalScore ?? 0).toFixed(2)}</span></p>
              </div>
            </div>
          </div>
        )}

        {/* Submission history (student) */}
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-medium text-slate-700">Lịch sử nộp bài</h3>
          <div className="space-y-2">
            {history && history.length > 0 ? (
              history.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded border border-slate-200 bg-white p-3 text-sm">
                  <div>
                    <div className="font-medium text-slate-800">{s.exam?.title || 'Đề thi'}</div>
                    <div className="text-xs text-slate-500">{new Date(s.submittedAt || s.startedAt).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{Number(s.autoScore ?? s.finalScore ?? s.totalScore ?? 0).toFixed(2)} điểm</div>
                    <div className="text-xs text-slate-500">{s.status}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded border border-slate-200 bg-white p-3 text-sm text-slate-500">Bạn chưa có bài nộp nào.</div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {sortedQuestions.map((question, index) => (
            <div key={question.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Câu {index + 1} · Phần {question.part}
                </p>
                <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
                  {question.maxScore} điểm
                </span>
              </div>

              <h2 className="text-lg font-semibold text-slate-800">
                {question.title || `Câu hỏi ${index + 1}`}
              </h2>
              <p className="mt-2 whitespace-pre-line text-slate-700">{question.content}</p>

              {question.type === 'MULTIPLE_CHOICE' && (
                <div className="mt-4 space-y-3">
                  {question.options.map((option) => (
                    <label key={option.id} className="flex items-start gap-3 rounded border border-slate-200 p-3">
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option.id}
                        checked={String(answers[question.id] || '') === String(option.id)}
                        onChange={(e) => updateAnswer(question.id, Number(e.target.value))}
                        className="mt-1"
                      />
                      <span className="text-sm text-slate-700">{option.optionText}</span>
                    </label>
                  ))}
                </div>
              )}

              {(question.type === 'SHORT_ANSWER' || question.type === 'ESSAY') && (
                <textarea
                  value={answers[question.id] || ''}
                  onChange={(e) => updateAnswer(question.id, e.target.value)}
                  rows={6}
                  className="mt-4 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="Nhập câu trả lời của bạn..."
                />
              )}
            </div>
          ))}

          <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Số câu: {sortedQuestions.length}</p>
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? 'Đang nộp bài...' : 'Nộp bài'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
