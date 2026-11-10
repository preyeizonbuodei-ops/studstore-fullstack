
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  Clock,
  RefreshCw,
  AlertCircle,
  Eye,
} from "lucide-react";
import { useStudentExamStore } from "./StudentExamStore";

const StudentExamHistory = () => {
  const navigate = useNavigate();

  const {
    history,
    loading,
    error,
    getExamHistory,
  } = useStudentExamStore();

  useEffect(() => {
    getExamHistory();
  }, [getExamHistory]);

  const getExamTitle = (attempt) =>
    attempt.examId?.title ||
    attempt.exam?.title ||
    attempt.examTitle ||
    "Examination";

  const getStatus = (attempt) =>
    attempt.status || "in progress";

  const getScore = (attempt) => {
    if (attempt.percentage !== undefined && attempt.percentage !== null) {
      return `${Number(attempt.percentage).toFixed(1)}%`;
    }

    if (attempt.score !== undefined && attempt.score !== null) {
      return attempt.totalMarks
        ? `${attempt.score}/${attempt.totalMarks}`
        : attempt.score;
    }

    return "Not available";
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime())
      ? "—"
      : parsedDate.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate("/me/exams")}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={18} />
          Back to Exams
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Exam History
          </h1>
          <p className="mt-2 text-slate-600">
            Review your previous exam attempts and available results.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={20} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <ClipboardList className="text-blue-600" size={22} />
              <h2 className="font-semibold text-slate-900">
                Your Attempts
              </h2>
            </div>

            <button
              type="button"
              onClick={getExamHistory}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {loading && history.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              Loading your exam history...
            </div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardList
                size={40}
                className="mx-auto mb-4 text-slate-400"
              />
              <h3 className="font-semibold text-slate-800">
                No exam attempts yet
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Exams you attempt will appear here.
              </p>
              <button
                type="button"
                onClick={() => navigate("/me/exams")}
                className="mt-5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Browse Exams
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Exam</th>
                    <th className="px-5 py-4 font-semibold">Date</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Score</th>
                    <th className="px-5 py-4 font-semibold">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {history.map((attempt) => (
                    <tr key={attempt._id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {getExamTitle(attempt)}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        <span className="inline-flex items-center gap-2">
                          <Clock size={15} />
                          {formatDate(
                            attempt.startedAt || attempt.createdAt
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-700">
                          {getStatus(attempt)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {getScore(attempt)}
                      </td>

                      <td className="px-5 py-4">
                        {attempt.status === "submitted" ||
                        attempt.status === "completed" ? (
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/me/exam-results/${attempt._id}`)
                            }
                            className="inline-flex items-center gap-2 font-medium text-blue-600 hover:text-blue-800"
                          >
                            <Eye size={16} />
                            View Result
                          </button>
                        ) : (
                          <span className="text-slate-400">
                            Not submitted
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentExamHistory;
