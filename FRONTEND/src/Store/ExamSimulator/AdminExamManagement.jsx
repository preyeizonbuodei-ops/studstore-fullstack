
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Plus,
  RefreshCw,
  Clock,
  BookOpen,
  AlertCircle,
  FileText,
  ListChecks,
  Send,
  CheckCircle,
} from "lucide-react";
import { useAdminExamStore } from "./AdminExamStore";

const getStatusStyle = (status) => {
  switch (status) {
    case "published":
      return "bg-green-100 text-green-700";
    case "archived":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-amber-100 text-amber-700";
  }
};

const getCourseTitle = (course) => {
  if (!course) return "Course not specified";

  if (typeof course === "object") {
    return (
      course.courseTitle ||
      course.title ||
      course.courseCode ||
      "Course"
    );
  }

  return "Course information unavailable";
};

export default function AdminExamManagement() {
  const navigate = useNavigate();
  const [publishingExamId, setPublishingExamId] = useState(null);
  const [actionError, setActionError] = useState("");

  const exams = useAdminExamStore((state) => state.exams);
  const loading = useAdminExamStore((state) => state.loading);
  const error = useAdminExamStore((state) => state.error);
  const getExams = useAdminExamStore((state) => state.getExams);
  const publishExam = useAdminExamStore((state) => state.publishExam);
  const clearMessages = useAdminExamStore(
    (state) => state.clearMessages
  );

  useEffect(() => {
    getExams();
  }, [getExams]);

  const handleRefresh = async () => {
    setActionError("");
    clearMessages();
    await getExams();
  };

  const handlePublish = async (exam) => {
    const confirmed = window.confirm(
      `Publish "${exam.title}"?\n\nStudents will be able to see this exam once it is published.`
    );

    if (!confirmed) return;

    setActionError("");
    setPublishingExamId(exam._id);

    try {
      const result = await publishExam(exam._id);

      // Some stores return undefined on success. Check the store's
      // error state as well as an explicit false result.
      const currentError = useAdminExamStore.getState().error;

      if (result === false || currentError) {
        setActionError(
          currentError || "The exam could not be published."
        );
        return;
      }

      await getExams();

      const refreshedError = useAdminExamStore.getState().error;

      if (refreshedError) {
        setActionError(
          `The exam may have been published, but the list could not be refreshed: ${refreshedError}`
        );
      }
    } catch (err) {
      setActionError(
        err?.response?.data?.message ||
          err?.message ||
          "An error occurred while publishing the exam."
      );
    } finally {
      setPublishingExamId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
              <ClipboardList size={18} />
              Admin Dashboard
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Exam Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Create and manage examinations, control publication
              status, and prepare exams for your students.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin/create-exam")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
          >
            <Plus size={19} />
            Create Exam
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Exams</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {exams.length}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <ClipboardList size={23} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Published Exams</p>
                <p className="mt-2 text-3xl font-bold text-green-700">
                  {
                    exams.filter(
                      (exam) => exam.status === "published"
                    ).length
                  }
                </p>
              </div>
              <div className="rounded-xl bg-green-50 p-3 text-green-600">
                <BookOpen size={23} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Draft Exams</p>
                <p className="mt-2 text-3xl font-bold text-amber-600">
                  {
                    exams.filter(
                      (exam) => exam.status === "draft"
                    ).length
                  }
                </p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <FileText size={23} />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                All Examinations
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                View and publish examinations created in StudStore.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || publishingExamId !== null}
              className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {(actionError || error) && (
            <div className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">
                  {actionError
                    ? "Unable to publish examination"
                    : "Unable to load examinations"}
                </p>
                <p className="mt-1">{actionError || error}</p>
              </div>
            </div>
          )}

          {loading && exams.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <RefreshCw
                size={30}
                className="animate-spin text-blue-600"
              />
              <p className="mt-4 font-medium text-slate-700">
                Loading examinations...
              </p>
            </div>
          ) : exams.length === 0 && !error ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="rounded-2xl bg-blue-50 p-5 text-blue-600">
                <ClipboardList size={34} />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-slate-900">
                No examinations yet
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Create your first examination, add questions, and
                publish it when it is ready for students.
              </p>

              <button
                type="button"
                onClick={() => navigate("/admin/create-exam")}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Plus size={18} />
                Create Your First Exam
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      Examination
                    </th>
                    <th className="px-5 py-4 font-semibold">Mode</th>
                    <th className="px-5 py-4 font-semibold">
                      Duration
                    </th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Created</th>
                    <th className="px-5 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {exams.map((exam) => (
                    <tr
                      key={exam._id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {exam.title}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {getCourseTitle(exam.courseId)}
                        </p>

                        {exam.topicId &&
                          typeof exam.topicId === "object" && (
                            <p className="mt-1 text-xs text-slate-400">
                              Topic:{" "}
                              {exam.topicId.title ||
                                exam.topicId.name ||
                                "Selected topic"}
                            </p>
                          )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium capitalize text-slate-700">
                          {exam.examMode === "cbt"
                            ? "Timed CBT"
                            : "Practice"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {exam.examMode === "cbt" ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Clock size={15} />
                            {exam.duration} min
                          </span>
                        ) : (
                          "No time limit"
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                            exam.status
                          )}`}
                        >
                          {exam.status || "draft"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {exam.createdAt
                          ? new Date(
                              exam.createdAt
                            ).toLocaleDateString()
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/admin-dashboard/exams/${exam._id}/questions`
                              )
                            }
                            className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
                          >
                            <ListChecks size={16} />
                            Manage Questions
                          </button>

                          {exam.status === "draft" && (
                            <button
                              type="button"
                              onClick={() => handlePublish(exam)}
                              disabled={
                                loading ||
                                publishingExamId !== null
                              }
                              className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {publishingExamId === exam._id ? (
                                <RefreshCw
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <Send size={16} />
                              )}
                              {publishingExamId === exam._id
                                ? "Publishing..."
                                : "Publish Exam"}
                            </button>
                          )}

                          {exam.status === "published" && (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
                              <CheckCircle size={16} />
                              Published
                            </span>
                          )}

                          {exam.status === "archived" && (
                            <span className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600">
                              Archived
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && exams.length > 0 && (
            <div className="border-t border-slate-200 px-5 py-4 text-sm text-slate-500">
              Showing {exams.length} examination
              {exams.length === 1 ? "" : "s"}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
