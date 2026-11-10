
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Clock,
  BookOpen,
  Play,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useStudentExamStore } from "./StudentExamStore";

const StudentExamDashboard = () => {
  const navigate = useNavigate();

  const {
    exams,
    loading,
    error,
    getPublishedExams,
    clearMessages,
  } = useStudentExamStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [examModeFilter, setExamModeFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    getPublishedExams();
  }, [getPublishedExams]);

  const getCourseName = (exam) => {
    if (exam.courseId && typeof exam.courseId === "object") {
      return (
        exam.courseId.courseTitle ||
        exam.courseId.title ||
        exam.courseId.courseCode ||
        exam.courseTitle ||
        exam.courseCode ||
        "Course"
      );
    }

    return exam.courseTitle || exam.courseCode || "Course";
  };

  const getCourseCode = (exam) => {
    if (exam.courseId && typeof exam.courseId === "object") {
      return (
        exam.courseId.courseCode ||
        exam.courseId.code ||
        exam.courseCode ||
        ""
      );
    }

    return exam.courseCode || "";
  };

  const getExamScope = (exam) => {
    const scope = String(
      exam.examScope ||
      exam.scope ||
      exam.examType ||
      exam.courseScope ||
      ""
    ).toLowerCase();

    if (scope.includes("topic")) return "topic";
    if (scope.includes("course")) return "course";

    // Infer scope from topic information when available.
    if (exam.topicId || exam.topic || exam.topicTitle) {
      return "topic";
    }

    return "unknown";
  };

  const handleStartExam = (exam) => {
    clearMessages();
    navigate(`/me/exams/${exam._id}`);
  };

  const filteredExams = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const result = exams.filter((exam) => {
      const searchableText = [
        exam.title,
        exam.description,
        getCourseName(exam),
        getCourseCode(exam),
        exam.topicTitle,
        exam.topic?.title,
        exam.topic?.topicTitle,
        exam.examMode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const mode = String(exam.examMode || "").toLowerCase();

      const matchesMode =
        examModeFilter === "all" ||
        (examModeFilter === "cbt" && mode === "cbt") ||
        (examModeFilter === "practice" && mode === "practice");

      const scope = getExamScope(exam);

      const matchesScope =
        scopeFilter === "all" ||
        scope === scopeFilter ||
        scope === "unknown";

      return matchesSearch && matchesMode && matchesScope;
    });

    result.sort((a, b) => {
      if (sortOrder === "az") {
        return String(a.title || "").localeCompare(
          String(b.title || "")
        );
      }

      if (sortOrder === "za") {
        return String(b.title || "").localeCompare(
          String(a.title || "")
        );
      }

      const dateA = new Date(
        a.createdAt || a.updatedAt || 0
      ).getTime();

      const dateB = new Date(
        b.createdAt || b.updatedAt || 0
      ).getTime();

      return dateB - dateA;
    });

    return result;
  }, [
    exams,
    searchTerm,
    examModeFilter,
    scopeFilter,
    sortOrder,
  ]);

  const clearFilters = () => {
    setSearchTerm("");
    setExamModeFilter("all");
    setScopeFilter("all");
    setSortOrder("newest");
  };

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    examModeFilter !== "all" ||
    scopeFilter !== "all";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
              Student Portal
            </p>

            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Exam Simulator
            </h1>

            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Find your examination quickly and test your understanding.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/me/exam-history")}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <ClipboardList size={18} />
              Exam History
            </button>

            <button
              type="button"
              onClick={getPublishedExams}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Unable to load exams</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-3 text-blue-700">
                <ClipboardList size={22} />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Available Exams
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {exams.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-3 text-emerald-700">
                <CheckCircle size={22} />
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Published Exams
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {exams.filter(
                    (exam) => exam.status === "published"
                  ).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-5 flex items-center gap-2">
          <BookOpen size={21} className="text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900">
            Available Examinations
          </h2>
        </div>

        {/* Search and filters */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <label
            htmlFor="exam-search"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Search examinations
          </label>

          <div className="relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="exam-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by exam title, course code, course name or topic..."
              className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label
                htmlFor="exam-mode"
                className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700"
              >
                <SlidersHorizontal size={16} />
                Exam mode
              </label>

              <select
                id="exam-mode"
                value={examModeFilter}
                onChange={(event) =>
                  setExamModeFilter(event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">All exam modes</option>
                <option value="cbt">Timed CBT</option>
                <option value="practice">Practice</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="exam-scope"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Examination scope
              </label>

              <select
                id="exam-scope"
                value={scopeFilter}
                onChange={(event) =>
                  setScopeFilter(event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">All examinations</option>
                <option value="course">Course exams</option>
                <option value="topic">Topic exams</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="exam-sort"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Sort examinations
              </label>

              <select
                id="exam-sort"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="newest">Newest first</option>
                <option value="az">Title: A to Z</option>
                <option value="za">Title: Z to A</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {filteredExams.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-800">
                {exams.length}
              </span>{" "}
              examinations
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <X size={16} />
                Clear filters
              </button>
            )}
          </div>
        </div>

        {loading && exams.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
            <RefreshCw
              size={30}
              className="mx-auto mb-4 animate-spin text-blue-600"
            />
            <p className="text-slate-600">
              Loading available exams...
            </p>
          </div>
        ) : exams.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <ClipboardList
              size={42}
              className="mx-auto mb-4 text-slate-400"
            />
            <h3 className="text-lg font-semibold text-slate-800">
              No exams available yet
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Published examinations will appear here when your administrator
              makes them available.
            </p>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Search
              size={42}
              className="mx-auto mb-4 text-slate-400"
            />
            <h3 className="text-lg font-semibold text-slate-800">
              No matching examinations
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Try another search term or change your filters to find an exam.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Clear search and filters
            </button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredExams.map((exam) => (
              <article
                key={exam._id}
                className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="rounded-lg bg-blue-50 p-3 text-blue-700">
                    <BookOpen size={23} />
                  </div>

                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold capitalize text-emerald-700">
                    {exam.status || "Published"}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  {exam.title}
                </h3>

                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                  {exam.description || "No description provided."}
                </p>

                <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <BookOpen
                      size={17}
                      className="shrink-0 text-slate-400"
                    />
                    <span>{getCourseName(exam)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock
                      size={17}
                      className="shrink-0 text-slate-400"
                    />
                    <span>
                      {exam.examMode === "cbt"
                        ? `${exam.duration} minutes`
                        : "Practice mode"}
                    </span>
                  </div>

                  <div className="text-sm text-slate-600">
                    Exam mode:{" "}
                    <span className="font-medium capitalize text-slate-800">
                      {exam.examMode === "cbt" ? "Timed CBT" : "Practice"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartExam(exam)}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  <Play size={18} />
                  View Exam
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentExamDashboard;
