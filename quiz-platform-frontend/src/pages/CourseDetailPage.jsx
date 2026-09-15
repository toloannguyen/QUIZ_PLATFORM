import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCourseById } from "../api/courseApi";
import { getLectures, createLecture } from "../api/lectureApi";
import {
  getMaterialsByLecture,
  uploadMaterial,
  deleteMaterial,
} from "../api/materialApi";
import { getExams, createExam } from "../api/examApi";
import { useAuth } from "../context/AuthContext";

const EMPTY_LECTURE_FORM = { title: "", description: "" };
const EMPTY_EXAM_FORM = {
  title: "",
  description: "",
  duration: 60,
  dueDate: "",
};

export default function CourseDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [materialMap, setMaterialMap] = useState({});
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lectureForm, setLectureForm] = useState(EMPTY_LECTURE_FORM);
  const [examForm, setExamForm] = useState(EMPTY_EXAM_FORM);
  const [lectureError, setLectureError] = useState("");
  const [examError, setExamError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadForms, setUploadForms] = useState({});
  const [submittingLecture, setSubmittingLecture] = useState(false);
  const [submittingExam, setSubmittingExam] = useState(false);
  const [uploadingMaterialId, setUploadingMaterialId] = useState(null);
  const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN";

  async function loadMaterialsForLecture(lectureId) {
    const res = await getMaterialsByLecture(lectureId);
    return res.data || [];
  }

  async function loadLectures() {
    try {
      const lectureRes = await getLectures({ courseId: id });
      const lectureItems = lectureRes.data || [];
      setLectures(lectureItems);

      const nextMaterials = {};
      await Promise.all(
        lectureItems.map(async (lecture) => {
          const materials = await loadMaterialsForLecture(lecture.id);
          nextMaterials[lecture.id] = materials;
        }),
      );
      setMaterialMap(nextMaterials);
    } catch (error) {
      console.error("Load lecture list failed", error);
    }
  }

  async function loadExams() {
    try {
      const res = await getExams({ courseId: id });
      setExams(res.data || []);
    } catch (error) {
      console.error("Load exam list failed", error);
    }
  }

  useEffect(() => {
    async function loadCourse() {
      try {
        const res = await getCourseById(id);
        setCourse(res.data);
      } catch (error) {
        console.error("Load course detail failed", error);
      }
    }

    loadCourse();
    loadLectures();
    loadExams();
  }, [id]);

  useEffect(() => {
    if (course && lectures.length) {
      setLoading(false);
    } else if (course) {
      setLoading(false);
    }
  }, [course, lectures.length]);

  async function handleCreateLecture(e) {
    e.preventDefault();
    setLectureError("");
    setSubmittingLecture(true);

    try {
      await createLecture({ ...lectureForm, courseId: Number(id) });
      setLectureForm(EMPTY_LECTURE_FORM);
      await loadLectures();
    } catch (error) {
      setLectureError(
        error.response?.data?.message || "Tạo bài giảng thất bại",
      );
    } finally {
      setSubmittingLecture(false);
    }
  }

  async function handleCreateExam(e) {
    e.preventDefault();
    setExamError("");
    setSubmittingExam(true);

    try {
      await createExam({
        ...examForm,
        courseId: Number(id),
        duration: Number(examForm.duration),
      });
      setExamForm(EMPTY_EXAM_FORM);
      await loadExams();
    } catch (error) {
      setExamError(error.response?.data?.message || "Tạo đề thi thất bại");
    } finally {
      setSubmittingExam(false);
    }
  }

  async function handleUploadMaterial(lectureId) {
    const form = uploadForms[lectureId] || {};
    const file = form.file;
    const title = (form.title || "").trim();

    if (!file || !title) {
      setUploadError("Vui lòng nhập tiêu đề và chọn file PDF");
      return;
    }

    setUploadingMaterialId(lectureId);
    setUploadError("");

    try {
      await uploadMaterial({ lectureId, title, file });
      setUploadForms((prev) => ({
        ...prev,
        [lectureId]: { title: "", file: null },
      }));
      await loadLectures();
    } catch (error) {
      setUploadError(
        error.response?.data?.message || "Upload tài liệu thất bại",
      );
    } finally {
      setUploadingMaterialId(null);
    }
  }

  async function handleDeleteMaterial(materialId, lectureId) {
    if (!window.confirm("Bạn có chắc muốn xóa tài liệu này?")) return;

    try {
      await deleteMaterial(materialId);
      const nextMaterials = (materialMap[lectureId] || []).filter(
        (material) => material.id !== materialId,
      );
      setMaterialMap((prev) => ({ ...prev, [lectureId]: nextMaterials }));
    } catch (error) {
      console.error("Delete material failed", error);
    }
  }

  if (loading) {
    return <div className="p-6 text-slate-500">Đang tải khóa học...</div>;
  }

  if (!course) {
    return <div className="p-6 text-red-500">Không tìm thấy khóa học.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                Chi tiết khóa học
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-800">
                {course.title}
              </h1>
            </div>
            <Link
              to="/courses"
              className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
            >
              Quay lại
            </Link>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-500">Mô tả</p>
            <p className="mt-2 text-slate-700">
              {course.description || "Không có mô tả"}
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">ID</p>
              <p className="mt-2 text-xl font-semibold text-slate-800">
                #{course.id}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Giáo viên</p>
              <p className="mt-2 text-xl font-semibold text-slate-800">
                {course.teacher?.name || course.teacherName || "N/A"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Ngày tạo</p>
              <p className="mt-2 text-xl font-semibold text-slate-800">
                {course.createdAt
                  ? new Date(course.createdAt).toLocaleDateString("vi-VN")
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {isTeacher && (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold text-slate-800">
              Thêm bài giảng
            </h2>
            {lectureError && (
              <div className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
                {lectureError}
              </div>
            )}

            <form
              onSubmit={handleCreateLecture}
              className="mt-5 grid gap-4 md:grid-cols-2"
            >
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Tiêu đề bài giảng
                </label>
                <input
                  value={lectureForm.title}
                  onChange={(e) =>
                    setLectureForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Ví dụ: Bài 1 - Khái niệm"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Mô tả
                </label>
                <textarea
                  value={lectureForm.description}
                  onChange={(e) =>
                    setLectureForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows="3"
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Mô tả nội dung bài giảng"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={submittingLecture}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                >
                  {submittingLecture ? "Đang tạo..." : "Tạo bài giảng"}
                </button>
              </div>
            </form>
          </div>
        )}

        {isTeacher && (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold text-slate-800">
              Thêm đề thi
            </h2>
            {examError && (
              <div className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
                {examError}
              </div>
            )}

            <form
              onSubmit={handleCreateExam}
              className="mt-5 grid gap-4 md:grid-cols-2"
            >
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Tên đề thi
                </label>
                <input
                  value={examForm.title}
                  onChange={(e) =>
                    setExamForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Ví dụ: Kiểm tra giữa kỳ"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Mô tả
                </label>
                <textarea
                  value={examForm.description}
                  onChange={(e) =>
                    setExamForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows="3"
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Mô tả phạm vi và yêu cầu của đề thi"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Thời lượng (phút)
                </label>
                <input
                  type="number"
                  min="1"
                  value={examForm.duration}
                  onChange={(e) =>
                    setExamForm((prev) => ({
                      ...prev,
                      duration: e.target.value,
                    }))
                  }
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Hạn nộp
                </label>
                <input
                  type="datetime-local"
                  value={examForm.dueDate}
                  onChange={(e) =>
                    setExamForm((prev) => ({
                      ...prev,
                      dueDate: e.target.value,
                    }))
                  }
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={submittingExam}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                >
                  {submittingExam ? "Đang tạo..." : "Tạo đề thi"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800">
              Đề thi của khóa học
            </h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {exams.length} đề thi
            </span>
          </div>

          {exams.length === 0 ? (
            <p className="text-sm text-slate-500">
              Khóa học này chưa có đề thi nào.
            </p>
          ) : (
            <div className="space-y-3">
              {exams.map((exam) => (
                <Link
                  key={exam.id}
                  to={`/exams/${exam.id}`}
                  className="block rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Đề thi #{exam.id}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-800">
                        {exam.title}
                      </h3>
                      {exam.description && (
                        <p className="mt-1 text-sm text-slate-600">
                          {exam.description}
                        </p>
                      )}
                    </div>
                    <div className="text-left text-sm text-slate-500 sm:text-right">
                      <p>{exam.duration} phút</p>
                      <p>
                        {exam.dueDate
                          ? new Date(exam.dueDate).toLocaleString("vi-VN")
                          : "Chưa có hạn nộp"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800">
              Bài giảng và tài liệu
            </h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {lectures.length} bài giảng
            </span>
          </div>

          {lectures.length === 0 ? (
            <p className="text-sm text-slate-500">
              Khóa học này chưa có bài giảng nào.
            </p>
          ) : (
            <div className="space-y-5">
              {lectures.map((lecture) => {
                const materials = materialMap[lecture.id] || [];

                return (
                  <div
                    key={lecture.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Bài giảng #{lecture.id}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-slate-800">
                          {lecture.title}
                        </h3>
                        {lecture.description && (
                          <p className="mt-1 text-sm text-slate-600">
                            {lecture.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
                        Tài liệu hỗ trợ
                      </h4>

                      {materials.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500">
                          Chưa có tài liệu nào cho bài giảng này.
                        </p>
                      ) : (
                        <ul className="mt-3 space-y-2">
                          {materials.map((material) => {
                            const backendBaseUrl =
                              import.meta.env.VITE_API_BASE_URL ||
                              "http://localhost:5000";
                            const fileUrl = new URL(
                              material.fileUrl,
                              backendBaseUrl,
                            ).toString();

                            return (
                              <li
                                key={material.id}
                                className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div>
                                  <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-medium text-blue-700 hover:underline"
                                  >
                                    {material.title}
                                  </a>
                                  <p className="text-xs text-slate-500">
                                    {material.fileName} ·{" "}
                                    {material.aiProcessed
                                      ? "AI đã xử lý"
                                      : material.aiError
                                        ? "AI lỗi"
                                        : "Đang xử lý"}
                                  </p>
                                </div>

                                {isTeacher && (
                                  <button
                                    onClick={() =>
                                      handleDeleteMaterial(
                                        material.id,
                                        lecture.id,
                                      )
                                    }
                                    className="rounded bg-red-500 px-3 py-2 text-xs font-medium text-white hover:bg-red-600"
                                  >
                                    Xóa
                                  </button>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    {isTeacher && (
                      <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-3">
                        <p className="text-sm font-medium text-slate-700">
                          Upload tài liệu PDF cho bài giảng
                        </p>
                        {uploadError && (
                          <div className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-600">
                            {uploadError}
                          </div>
                        )}

                        <div className="mt-3 grid gap-3 md:grid-cols-[1.2fr_1fr_auto]">
                          <input
                            type="text"
                            value={uploadForms[lecture.id]?.title || ""}
                            onChange={(e) =>
                              setUploadForms((prev) => ({
                                ...prev,
                                [lecture.id]: {
                                  ...(prev[lecture.id] || {}),
                                  title: e.target.value,
                                },
                              }))
                            }
                            className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            placeholder="Tên tài liệu"
                          />

                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) =>
                              setUploadForms((prev) => ({
                                ...prev,
                                [lecture.id]: {
                                  ...(prev[lecture.id] || {}),
                                  file: e.target.files?.[0] || null,
                                },
                              }))
                            }
                            className="rounded border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700"
                          />

                          <button
                            type="button"
                            onClick={() => handleUploadMaterial(lecture.id)}
                            disabled={uploadingMaterialId === lecture.id}
                            className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:bg-slate-400"
                          >
                            {uploadingMaterialId === lecture.id
                              ? "Đang tải..."
                              : "Upload"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
