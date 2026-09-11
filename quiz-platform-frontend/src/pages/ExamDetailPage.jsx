import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getExamById, getExamTake } from '../api/examApi';
import { getQuestionsByExam, createQuestion } from '../api/questionApi';

const EMPTY_QUESTION_FORM = {
  examId: '',
  orderNumber: 1,
  part: 1,
  type: 'MULTIPLE_CHOICE',
  title: '',
  content: '',
  maxScore: 10,
  correctAnswer: '',
  explanation: '',
  options: [
    { optionText: '', isCorrect: true },
    { optionText: '', isCorrect: false },
  ],
};

export default function ExamDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [examTake, setExamTake] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionForm, setQuestionForm] = useState({ ...EMPTY_QUESTION_FORM, examId: Number(id) || '' });
  const [questionError, setQuestionError] = useState('');

  async function loadExam() {
    try {
      const examRes = await getExamById(id);
      setExam(examRes.data);
      setQuestionForm((prev) => ({ ...prev, examId: Number(id) || prev.examId }));

      if (user?.role === 'STUDENT') {
        const takeRes = await getExamTake(id);
        setExamTake(takeRes.data);
      }

      if (user?.role === 'TEACHER' || user?.role === 'ADMIN') {
        const qRes = await getQuestionsByExam(id);
        setQuestions(qRes.data || []);
      }
    } catch (error) {
      console.error('Load exam detail failed', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExam();
  }, [id, user?.role]);

  function handleQuestionChange(e) {
    const { name, value } = e.target;
    setQuestionForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleOptionChange(index, field, value) {
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.map((option, i) => {
        if (i !== index) return option;
        if (field === 'isCorrect') {
          return { ...option, isCorrect: Boolean(value) };
        }
        return { ...option, [field]: value };
      }),
    }));
  }

  function addOptionField() {
    setQuestionForm((prev) => ({
      ...prev,
      options: [...(prev.options || []), { optionText: '', isCorrect: false }],
    }));
  }

  async function handleCreateQuestion(e) {
    e.preventDefault();
    setQuestionError('');

    try {
      const payload = {
        ...questionForm,
        examId: Number(questionForm.examId),
        orderNumber: Number(questionForm.orderNumber),
        part: Number(questionForm.part),
        maxScore: Number(questionForm.maxScore),
      };

      if (payload.type === 'MULTIPLE_CHOICE') {
        payload.options = payload.options
          .filter((option) => option.optionText && option.optionText.trim())
          .map((option) => ({
            optionText: option.optionText,
            isCorrect: !!option.isCorrect,
          }));
      } else {
        payload.options = [];
      }

      if (payload.type === 'SHORT_ANSWER') {
        payload.correctAnswer = payload.correctAnswer || '';
      }

      if (payload.type === 'ESSAY') {
        payload.correctAnswer = '';
      }

      await createQuestion(payload);
      setQuestionForm({
        ...EMPTY_QUESTION_FORM,
        examId: Number(id),
      });
      const qRes = await getQuestionsByExam(id);
      setQuestions(qRes.data || []);
    } catch (error) {
      setQuestionError(error.response?.data?.message || 'Tạo câu hỏi thất bại');
    }
  }

  if (loading) {
    return <div className="p-6 text-slate-500">Đang tải đề thi...</div>;
  }

  if (!exam) {
    return <div className="p-6 text-red-500">Không tìm thấy đề thi.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Chi tiết đề thi</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-800">{exam.title}</h1>
          </div>
          <Link to="/exams" className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900">
            Quay lại
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Thời lượng</p>
            <p className="mt-2 text-xl font-semibold text-slate-800">{exam.duration} phút</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Hạn nộp</p>
            <p className="mt-2 text-sm font-semibold text-slate-800">
              {exam.dueDate ? new Date(exam.dueDate).toLocaleString('vi-VN') : 'N/A'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Khóa học</p>
            <p className="mt-2 text-xl font-semibold text-slate-800">#{exam.courseId}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Ngày tạo</p>
            <p className="mt-2 text-sm font-semibold text-slate-800">
              {exam.createdAt ? new Date(exam.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-500">Mô tả</p>
          <p className="mt-2 text-slate-700">{exam.description || 'Không có mô tả'}</p>
        </div>

        {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-xl font-semibold text-slate-800">Thêm câu hỏi cho đề thi</h2>
            {questionError && <div className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{questionError}</div>}

            <form onSubmit={handleCreateQuestion} className="mt-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Loại câu hỏi</label>
                  <select
                    name="type"
                    value={questionForm.type}
                    onChange={handleQuestionChange}
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
                    <option value="SHORT_ANSWER">Ngắn</option>
                    <option value="ESSAY">Tự luận</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Điểm tối đa</label>
                  <input
                    name="maxScore"
                    type="number"
                    min="1"
                    value={questionForm.maxScore}
                    onChange={handleQuestionChange}
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Số thứ tự</label>
                  <input
                    name="orderNumber"
                    type="number"
                    min="1"
                    value={questionForm.orderNumber}
                    onChange={handleQuestionChange}
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Phần</label>
                  <input
                    name="part"
                    type="number"
                    min="1"
                    value={questionForm.part}
                    onChange={handleQuestionChange}
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Tiêu đề câu hỏi</label>
                <input
                  name="title"
                  value={questionForm.title}
                  onChange={handleQuestionChange}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Ví dụ: Khái niệm cơ bản"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nội dung câu hỏi</label>
                <textarea
                  name="content"
                  value={questionForm.content}
                  onChange={handleQuestionChange}
                  rows="4"
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                  required
                />
              </div>

              {questionForm.type === 'MULTIPLE_CHOICE' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Các phương án</label>
                    <button
                      type="button"
                      onClick={addOptionField}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700"
                    >
                      + Thêm đáp án
                    </button>
                  </div>

                  {questionForm.options.map((option, index) => (
                    <div key={index} className="grid gap-2 rounded border border-slate-200 bg-white p-3 md:grid-cols-[1fr_auto]">
                      <input
                        value={option.optionText}
                        onChange={(e) => handleOptionChange(index, 'optionText', e.target.value)}
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                        placeholder={`Đáp án ${index + 1}`}
                      />
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={Boolean(option.isCorrect)}
                          onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                        />
                        Đúng
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {(questionForm.type === 'SHORT_ANSWER' || questionForm.type === 'ESSAY') && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {questionForm.type === 'SHORT_ANSWER' ? 'Đáp án tham chiếu' : 'Ghi chú nội dung tự luận'}
                  </label>
                  <textarea
                    name="correctAnswer"
                    value={questionForm.correctAnswer}
                    onChange={handleQuestionChange}
                    rows="3"
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    placeholder={questionForm.type === 'SHORT_ANSWER' ? 'Nhập đáp án mẫu để AI chấm' : 'Không bắt buộc cho ESSAY'}
                  />
                </div>
              )}

              <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                Lưu câu hỏi
              </button>
            </form>
          </div>
        )}

        {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-slate-800">Danh sách câu hỏi</h2>
            <div className="mt-4 space-y-4">
              {questions.length === 0 ? (
                <p className="text-sm text-slate-500">Chưa có câu hỏi nào trong đề thi này.</p>
              ) : (
                questions.map((question, index) => (
                  <div key={question.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Câu {index + 1} · {question.type}
                      </p>
                      <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
                        {question.maxScore} điểm
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-slate-800">{question.title || `Câu hỏi ${index + 1}`}</h3>
                    <p className="mt-2 whitespace-pre-line text-slate-700">{question.content}</p>
                    {question.options?.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {question.options.map((option, idx) => (
                          <div key={option.id || idx} className="flex items-center gap-2 text-sm text-slate-700">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[10px]">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span>{option.optionText}</span>
                            {option.isCorrect && (
                              <span className="rounded bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">Đúng</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-slate-800">Thông tin làm bài</h2>
          {user?.role === 'STUDENT' ? (
            examTake ? (
              <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                <p className="text-sm text-indigo-700">Bài thi đang có {examTake.questions?.length || 0} câu hỏi.</p>
                <p className="mt-2 text-sm text-indigo-700">
                  Trạng thái hết hạn: {examTake.isExpired ? 'Đã hết hạn' : 'Còn mở'}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Không có dữ liệu preview làm bài.</p>
            )
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Vai trò {user?.role?.toLowerCase() || 'hiện tại'} không cần làm bài trực tiếp trên giao diện này.
            </p>
          )}

          {user?.role === 'STUDENT' && (
            <div className="mt-5 flex justify-end">
              <Link
                to={`/exams/${id}/take`}
                className="rounded bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Bắt đầu làm bài
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
