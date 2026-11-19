
import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    BookOpen,
    Download,
    ExternalLink,
    FileText,
    LoaderCircle,
    RefreshCw,
    Search,
} from "lucide-react";

import { useAuthStore } from "../../../Store/AuthStore";

const getCourse = (paper) =>
    paper?.courseId && typeof paper.courseId === "object"
        ? paper.courseId
        : {};

const getCourseName = (course) =>
    [course?.courseCode, course?.courseTitle]
        .filter(Boolean)
        .join(" - ") || "Unknown course";

export default function StudentPastQuestionsLibrary() {
    const papers = useAuthStore(
        (state) => state.pastQuestionPapers || []
    );

    const isLoading = useAuthStore(
        (state) => state.isPastQuestionsLoading
    );

    const error = useAuthStore(
        (state) => state.pastQuestionsError
    );

    const getPapers = useAuthStore(
        (state) => state.GetStudentPastQuestionPapers
    );

    const [search, setSearch] = useState("");
    const [semesterFilter, setSemesterFilter] = useState("all");
    const [yearFilter, setYearFilter] = useState("all");

    useEffect(() => {
        const loadPapers = async () => {
            try {
                await getPapers();
            } catch (err) {
                console.error("Failed to load past questions:", err);
            }
        };

        loadPapers();
    }, [getPapers]);

    const academicYears = useMemo(() => {
        return [
            ...new Set(
                papers
                    .map((paper) => paper.academicYear)
                    .filter(Boolean)
            ),
        ].sort((a, b) => b.localeCompare(a));
    }, [papers]);

    const filteredPapers = useMemo(() => {
        const query = search.trim().toLowerCase();

        return papers.filter((paper) => {
            const course = getCourse(paper);

            const matchesSearch =
                !query ||
                [
                    paper.title,
                    paper.academicYear,
                    paper.description,
                    course.courseCode,
                    course.courseTitle,
                    course.department,
                    course.level,
                ]
                    .filter(Boolean)
                    .some((value) =>
                        String(value).toLowerCase().includes(query)
                    );

            const matchesSemester =
                semesterFilter === "all" ||
                paper.semester === semesterFilter;

            const matchesYear =
                yearFilter === "all" ||
                paper.academicYear === yearFilter;

            return (
                matchesSearch &&
                matchesSemester &&
                matchesYear
            );
        });
    }, [papers, search, semesterFilter, yearFilter]);

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-6">

                {/* Heading */}
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                            <BookOpen size={25} />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Past Questions Library
                            </h1>

                            <p className="mt-1 text-sm text-gray-600">
                                Find and practise with past examination question papers.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search and filters */}
                <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="relative md:col-span-1">
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />

                            <input
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search course code, title, or year..."
                                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <select
                            value={semesterFilter}
                            onChange={(event) =>
                                setSemesterFilter(event.target.value)
                            }
                            className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                        >
                            <option value="all">All semesters</option>
                            <option value="first">First semester</option>
                            <option value="second">Second semester</option>
                            <option value="not-specified">
                                Not specified
                            </option>
                        </select>

                        <select
                            value={yearFilter}
                            onChange={(event) =>
                                setYearFilter(event.target.value)
                            }
                            className="rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                        >
                            <option value="all">All academic sessions</option>

                            {academicYears.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-gray-500">
                            {filteredPapers.length}{" "}
                            {filteredPapers.length === 1
                                ? "paper"
                                : "papers"}{" "}
                            available
                        </p>

                        <button
                            type="button"
                            onClick={async () => {
                                try {
                                    await getPapers();
                                } catch (err) {
                                    console.error(
                                        "Failed to refresh past questions:",
                                        err
                                    );
                                }
                            }}
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            <RefreshCw
                                size={16}
                                className={isLoading ? "animate-spin" : ""}
                            />
                            Refresh
                        </button>
                    </div>
                </section>

                {/* Error */}
                {error && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <AlertCircle
                            size={19}
                            className="mt-0.5 shrink-0"
                        />
                        <p>{error}</p>
                    </div>
                )}

                {/* Loading */}
                {isLoading && papers.length === 0 && (
                    <div className="flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-16 text-sm text-gray-500">
                        <LoaderCircle
                            size={22}
                            className="animate-spin"
                        />
                        Loading past questions...
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && filteredPapers.length === 0 && (
                    <div className="rounded-xl border border-gray-200 bg-white px-5 py-16 text-center">
                        <FileText
                            size={42}
                            className="mx-auto text-gray-300"
                        />

                        <h2 className="mt-4 text-lg font-semibold text-gray-800">
                            {papers.length === 0
                                ? "No past questions available yet"
                                : "No matching papers found"}
                        </h2>

                        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                            {papers.length === 0
                                ? "Published past-question papers for your courses will appear here when administrators add them."
                                : "Try another search term or change your filters."}
                        </p>
                    </div>
                )}

                {/* Paper cards */}
                {filteredPapers.length > 0 && (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {filteredPapers.map((paper) => {
                            const course = getCourse(paper);

                            return (
                                <article
                                    key={paper._id}
                                    className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                            <FileText size={23} />
                                        </div>

                                        <div className="min-w-0">
                                            <h2 className="font-semibold text-gray-900">
                                                {paper.title}
                                            </h2>

                                            <p className="mt-1 text-sm font-medium text-blue-700">
                                                {getCourseName(course)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                                            {paper.academicYear}
                                        </span>

                                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs capitalize text-blue-700">
                                            {paper.semester === "not-specified"
                                                ? "Semester not specified"
                                                : `${paper.semester || "Semester"} semester`}
                                        </span>

                                        {course.level && (
                                            <span className="rounded-full bg-purple-50 px-3 py-1 text-xs text-purple-700">
                                                {course.level}
                                            </span>
                                        )}
                                    </div>

                                    {paper.description && (
                                        <p className="mt-4 flex-1 text-sm leading-6 text-gray-600">
                                            {paper.description}
                                        </p>
                                    )}

                                    {course.department && (
                                        <p className="mt-3 text-xs text-gray-500">
                                            Department: {course.department}
                                        </p>
                                    )}

                                    <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
                                        <a
                                            href={paper.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                                        >
                                            <ExternalLink size={16} />
                                            Open PDF
                                        </a>

                                        <a
                                            href={paper.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download
                                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            <Download size={16} />
                                            Download
                                        </a>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
