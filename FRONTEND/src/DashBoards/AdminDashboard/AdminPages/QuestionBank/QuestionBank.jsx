
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  FileText,
  RefreshCw,
  BookOpen,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { useQuestionBankStore } from "../../../../Store/ExamSimulator/QuestionBankStore";

const QuestionBank = () => {
  const navigate = useNavigate();

  const {
    papers,
    loading,
    error,
    getPastQuestionPapers,
    clearMessages,
  } = useQuestionBankStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    getPastQuestionPapers();
  }, [getPastQuestionPapers]);

  const filteredPapers = useMemo(() => {
    return papers.filter((paper) => {
      const course = paper.courseId || {};

      const searchValue = searchTerm.toLowerCase();

      const matchesSearch =
        paper.title?.toLowerCase().includes(searchValue) ||
        paper.academicYear?.toLowerCase().includes(searchValue) ||
        course.courseTitle?.toLowerCase().includes(searchValue) ||
        course.courseCode?.toLowerCase().includes(searchValue);

      const matchesYear =
        !academicYear || paper.academicYear === academicYear;

      const matchesSemester =
        !semester || paper.semester === semester;

      const matchesStatus =
        !status || paper.status === status;

      return (
        matchesSearch &&
        matchesYear &&
        matchesSemester &&
        matchesStatus
      );
    });
  }, [papers, searchTerm, academicYear, semester, status]);

  const handleRefresh = () => {
    clearMessages();
    getPastQuestionPapers();
  };

  const getStatusStyle = (paperStatus) => {
    switch (paperStatus) {
      case "published":
        return "bg-green-100 text-green-700";

      case "archived":
        return "bg-gray-100 text-gray-600";

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  const formatSemester = (value) => {
    if (!value) return "Not specified";

    return value === "first" ? "First Semester" : "Second Semester";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Page heading */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Question Bank
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Manage past-question papers and their individual questions.
            </p>
          </div>

          <button
            onClick={() =>
              navigate("/admin-dashboard/question-bank/upload")
            }
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Upload Past Questions
          </button>
        </div>

        {/* Statistics */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
                <FileText size={22} />
              </div>

              <div>
                <p className="text-sm text-gray-500">Total Papers</p>
                <h2 className="text-2xl font-bold text-gray-900">
                  {papers.length}
                </h2>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-3 text-green-600">
                <BookOpen size={22} />
              </div>

              <div>
                <p className="text-sm text-gray-500">Published</p>
                <h2 className="text-2xl font-bold text-gray-900">
                  {papers.filter((paper) => paper.status === "published").length}
                </h2>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 p-3 text-yellow-600">
                <FileText size={22} />
              </div>

              <div>
                <p className="text-sm text-gray-500">Draft Papers</p>
                <h2 className="text-2xl font-bold text-gray-900">
                  {papers.filter((paper) => paper.status === "draft").length}
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                placeholder="Search papers or courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <input
              type="text"
              placeholder="Academic year e.g. 2025/2026"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
            />

            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">All Semesters</option>
              <option value="first">First Semester</option>
              <option value="second">Second Semester</option>
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="mt-4 flex justify-between">
            <button
              onClick={() => {
                setSearchTerm("");
                setAcademicYear("");
                setSemester("");
                setStatus("");
              }}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Paper list */}
        {loading && papers.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
            <RefreshCw
              size={28}
              className="mx-auto animate-spin text-blue-600"
            />
            <p className="mt-3 text-sm text-gray-500">
              Loading past-question papers...
            </p>
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-16 text-center">
            <FileText size={42} className="mx-auto text-gray-300" />

            <h3 className="mt-4 text-lg font-semibold text-gray-800">
              No past-question papers found
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Upload a past-question paper to start building your Question Bank.
            </p>

            <button
              onClick={() =>
                navigate("/admin-dashboard/question-bank/upload")
              }
              className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Upload Paper
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {filteredPapers.map((paper) => {
              const course = paper.courseId || {};

              return (
                <div
                  key={paper._id}
                  className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                        <FileText size={22} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="break-words font-semibold text-gray-900">
                          {paper.title}
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          {course.courseCode || "Course"}{" "}
                          {course.courseTitle
                            ? `- ${course.courseTitle}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                        paper.status
                      )}`}
                    >
                      {paper.status}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={16} className="text-gray-400" />
                      <span>{paper.academicYear}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                      <BookOpen size={16} className="text-gray-400" />
                      <span>{formatSemester(paper.semester)}</span>
                    </div>
                  </div>

                  {paper.description && (
                    <p className="mt-4 line-clamp-2 text-sm text-gray-500">
                      {paper.description}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <a
                      href={paper.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink size={15} />
                      View PDF
                    </a>

                    <button
                      onClick={() =>
                        navigate(
                          `/admin-dashboard/question-bank/papers/${paper._id}`
                        )
                      }
                      className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700"
                    >
                      Manage Questions
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-5 text-sm text-gray-500">
          Showing {filteredPapers.length} of {papers.length} papers
        </p>
      </div>
    </div>
  );
};

export default QuestionBank;
