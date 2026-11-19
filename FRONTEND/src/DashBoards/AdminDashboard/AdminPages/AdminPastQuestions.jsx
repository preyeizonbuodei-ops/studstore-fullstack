
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    BookOpen,
    CheckCircle2,
    Download,
    Edit,
    ExternalLink,
    FileText,
    LoaderCircle,
    Plus,
    RefreshCw,
    Save,
    Search,
    Trash2,
    X,
} from "lucide-react";

import { AdminRegister } from "../../../Store/AdminStore";
import createCourseStore from "../../UserDashboard/CourseStore/CourseStore";

const initialForm = {
    courseId: "",
    title: "",
    academicYear: "",
    semester: "not-specified",
    fileUrl: "",
    publicId: "",
    description: "",
};

const getId = (item) => item?._id || item?.id || "";

const getErrorMessage = (error, fallback) =>
    error?.response?.data?.message || error?.message || fallback;

const getCourseName = (course) => {
    if (!course) return "Unknown course";

    const code = course.courseCode || "";
    const title = course.courseTitle || "";

    return [code, title].filter(Boolean).join(" - ") || "Untitled course";
};

const getStatusClass = (status) => {
    switch (status) {
        case "published":
            return "bg-green-100 text-green-700";
        case "archived":
            return "bg-gray-100 text-gray-700";
        default:
            return "bg-amber-100 text-amber-700";
    }
};

export default function AdminPastQuestions() {
    // Admin Zustand store
    const papers = AdminRegister((state) => state.pastQuestionPapers || []);
    const isLoading = AdminRegister(
        (state) => state.isPastQuestionsLoading
    );
    const error = AdminRegister((state) => state.pastQuestionsError);

    const createPaper = AdminRegister(
        (state) => state.CreatePastQuestionPaper
    );
    const getPapers = AdminRegister(
        (state) => state.GetPastQuestionPapers
    );
    const updatePaper = AdminRegister(
        (state) => state.UpdatePastQuestionPaper
    );
    const updatePaperStatus = AdminRegister(
        (state) => state.UpdatePastQuestionPaperStatus
    );
    const deletePaper = AdminRegister(
        (state) => state.DeletePastQuestionPaper
    );

    // Existing course store
    const getCourses = createCourseStore((state) => state.getCourses);

    const [courses, setCourses] = useState([]);
    const [isCoursesLoading, setIsCoursesLoading] = useState(false);
    const [courseError, setCourseError] = useState("");

    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const loadPapers = useCallback(async () => {
        try {
            await getPapers();
        } catch (err) {
            console.error("Failed to load past-question papers:", err);
        }
    }, [getPapers]);

    const loadCourses = useCallback(async () => {
        setIsCoursesLoading(true);
        setCourseError("");

        try {
            const response = await getCourses();
            setCourses(
                Array.isArray(response?.courses)
                    ? response.courses
                    : []
            );
        } catch (err) {
            setCourseError(
                getErrorMessage(err, "Unable to load courses.")
            );
        } finally {
            setIsCoursesLoading(false);
        }
    }, [getCourses]);

    useEffect(() => {
        loadPapers();
        loadCourses();
    }, [loadPapers, loadCourses]);

    const filteredPapers = useMemo(() => {
        const query = search.trim().toLowerCase();

        return papers.filter((paper) => {
            const course = paper.courseId || {};
            const matchesSearch =
                !query ||
                [
                    paper.title,
                    paper.academicYear,
                    course.courseCode,
                    course.courseTitle,
                    course.department,
                ]
                    .filter(Boolean)
                    .some((value) =>
                        String(value).toLowerCase().includes(query)
                    );

            const matchesStatus =
                statusFilter === "all" ||
                paper.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [papers, search, statusFilter]);

    const resetForm = () => {
        setForm(initialForm);
        setEditingId(null);
        setFormError("");
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleEdit = (paper) => {
        setEditingId(getId(paper));

        setForm({
            courseId:
                typeof paper.courseId === "object"
                    ? getId(paper.courseId)
                    : paper.courseId || "",
            title: paper.title || "",
            academicYear: paper.academicYear || "",
            semester: paper.semester || "not-specified",
            fileUrl: paper.fileUrl || "",
            publicId: paper.publicId || "",
            description: paper.description || "",
        });

        setFormError("");
        setSuccessMessage("");

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setFormError("");
        setSuccessMessage("");

        if (
            !form.courseId ||
            !form.title.trim() ||
            !form.academicYear.trim() ||
            !form.fileUrl.trim() ||
            !form.publicId.trim()
        ) {
            setFormError(
                "Please complete all required fields, including the Cloudinary PDF URL and public ID."
            );
            return;
        }

        if (!/^https?:\/\//i.test(form.fileUrl.trim())) {
            setFormError("Enter a valid PDF URL beginning with https://.");
            return;
        }

        const payload = {
            courseId: form.courseId,
            title: form.title.trim(),
            academicYear: form.academicYear.trim(),
            semester: form.semester,
            fileUrl: form.fileUrl.trim(),
            publicId: form.publicId.trim(),
            description: form.description.trim(),
        };

        setIsSaving(true);

        try {
            if (editingId) {
                await updatePaper(editingId, payload);
                setSuccessMessage("Past-question paper updated successfully.");
            } else {
                await createPaper(payload);
                setSuccessMessage(
                    "Past-question paper added successfully. It is saved as a draft."
                );
            }

            resetForm();
            await loadPapers();
        } catch (err) {
            setFormError(
                getErrorMessage(err, "Unable to save this paper.")
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleStatusChange = async (paper, status) => {
        const paperId = getId(paper);

        const actionText =
            status === "published"
                ? "publish"
                : status === "archived"
                    ? "archive"
                    : "move back to drafts";

        if (!window.confirm(`Are you sure you want to ${actionText} this paper?`)) {
            return;
        }

        setSuccessMessage("");

        try {
            await updatePaperStatus(paperId, status);
            await loadPapers();

            setSuccessMessage(
                `Paper ${status === "published" ? "published" : status === "archived" ? "archived" : "moved to drafts"} successfully.`
            );
        } catch (err) {
            setFormError(
                getErrorMessage(err, "Unable to update the paper status.")
            );
        }
    };

    const handleDelete = async (paper) => {
        const paperId = getId(paper);

        if (
            !window.confirm(
                "Delete this past-question record from StudStore? This does not delete the PDF from Cloudinary."
            )
        ) {
            return;
        }

        try {
            await deletePaper(paperId);
            setSuccessMessage("Past-question record deleted successfully.");

            if (editingId === paperId) {
                resetForm();
            }

            await loadPapers();
        } catch (err) {
            setFormError(
                getErrorMessage(err, "Unable to delete this paper.")
            );
        }
    };

    const publishedCount = papers.filter(
        (paper) => paper.status === "published"
    ).length;

    const draftCount = papers.filter(
        (paper) => paper.status === "draft"
    ).length;

    const archivedCount = papers.filter(
        (paper) => paper.status === "archived"
    ).length;

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-7">

                {/* Page heading */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <FileText className="text-blue-600" size={26} />
                            <h1 className="text-2xl font-bold text-gray-900">
                                Past Questions Library
                            </h1>
                        </div>

                        <p className="mt-2 text-sm text-gray-600">
                            Manage PDF past-question papers for StudStore students.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            loadPapers();
                            loadCourses();
                        }}
                        disabled={isLoading || isCoursesLoading}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                        <RefreshCw
                            size={17}
                            className={
                                isLoading || isCoursesLoading
                                    ? "animate-spin"
                                    : ""
                            }
                        />
                        Refresh
                    </button>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <p className="text-sm text-gray-500">Published papers</p>
                        <p className="mt-2 text-3xl font-bold text-green-600">
                            {publishedCount}
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <p className="text-sm text-gray-500">Draft papers</p>
                        <p className="mt-2 text-3xl font-bold text-amber-600">
                            {draftCount}
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                        <p className="text-sm text-gray-500">Archived papers</p>
                        <p className="mt-2 text-3xl font-bold text-gray-700">
                            {archivedCount}
                        </p>
                    </div>
                </div>

                {/* Notifications */}
                {successMessage && (
                    <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                        <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
                        <p>{successMessage}</p>
                    </div>
                )}

                {(error || formError || courseError) && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <AlertCircle size={19} className="mt-0.5 shrink-0" />
                        <div>
                            {formError && <p>{formError}</p>}
                            {error && <p>{error}</p>}
                            {courseError && <p>{courseError}</p>}
                        </div>
                    </div>
                )}

                {/* Add / Edit form */}
                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
                    <div className="mb-6 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                {editingId ? "Edit Past-Question Paper" : "Add Past-Question Paper"}
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Provide the paper details and its Cloudinary PDF information.
                            </p>
                        </div>

                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                            >
                                <X size={16} />
                                Cancel
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                            {/* Course */}
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Course *
                                </label>

                                <select
                                    name="courseId"
                                    value={form.courseId}
                                    onChange={handleChange}
                                    required
                                    disabled={isCoursesLoading}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                                >
                                    <option value="">
                                        {isCoursesLoading
                                            ? "Loading courses..."
                                            : "Select a course"}
                                    </option>

                                    {courses.map((course) => (
                                        <option
                                            key={getId(course)}
                                            value={getId(course)}
                                        >
                                            {getCourseName(course)}
                                            {course.department
                                                ? ` (${course.department})`
                                                : ""}
                                            {course.level
                                                ? ` - ${course.level}`
                                                : ""}
                                        </option>
                                    ))}
                                </select>

                                {!isCoursesLoading && courses.length === 0 && (
                                    <p className="mt-2 text-xs text-amber-600">
                                        No courses were returned. Refresh the page or check the admin course endpoint.
                                    </p>
                                )}
                            </div>

                            {/* Paper title */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Paper title *
                                </label>

                                <input
                                    type="text"
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    placeholder="e.g. PHY 101 Past Questions"
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            {/* Academic year */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Academic year / session *
                                </label>

                                <input
                                    type="text"
                                    name="academicYear"
                                    value={form.academicYear}
                                    onChange={handleChange}
                                    placeholder="e.g. 2023/2024"
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            {/* Semester */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Semester
                                </label>

                                <select
                                    name="semester"
                                    value={form.semester}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="not-specified">
                                        Not specified
                                    </option>
                                    <option value="first">
                                        First semester
                                    </option>
                                    <option value="second">
                                        Second semester
                                    </option>
                                </select>
                            </div>

                            {/* Cloudinary PDF URL */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Cloudinary PDF URL *
                                </label>

                                <input
                                    type="url"
                                    name="fileUrl"
                                    value={form.fileUrl}
                                    onChange={handleChange}
                                    placeholder="https://res.cloudinary.com/..."
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            {/* Cloudinary public ID */}
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Cloudinary public ID *
                                </label>

                                <input
                                    type="text"
                                    name="publicId"
                                    value={form.publicId}
                                    onChange={handleChange}
                                    placeholder="e.g. studstore/past-questions/phy-101-2023"
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                                <p className="mt-1 text-xs text-gray-500">
                                    Enter the public ID from Cloudinary. No file upload is performed here.
                                </p>
                            </div>

                            {/* Description */}
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Description
                                </label>

                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Optional information about this past-question paper..."
                                    className="w-full resize-y rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row">
                            <button
                                type="submit"
                                disabled={isSaving || isCoursesLoading}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSaving ? (
                                    <LoaderCircle size={18} className="animate-spin" />
                                ) : editingId ? (
                                    <Save size={18} />
                                ) : (
                                    <Plus size={18} />
                                )}

                                {isSaving
                                    ? "Saving..."
                                    : editingId
                                        ? "Update Paper"
                                        : "Add Paper"}
                            </button>

                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel editing
                                </button>
                            )}
                        </div>
                    </form>
                </section>

                {/* Papers list */}
                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 p-5 sm:p-6">
                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    Manage Past-Question Papers
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Edit, publish, archive, or delete library records.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <div className="relative">
                                    <Search
                                        size={17}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    />
                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Search papers or courses..."
                                        className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-64"
                                    />
                                </div>

                                <select
                                    value={statusFilter}
                                    onChange={(event) =>
                                        setStatusFilter(event.target.value)
                                    }
                                    className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                                >
                                    <option value="all">All statuses</option>
                                    <option value="draft">Drafts</option>
                                    <option value="published">Published</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {isLoading && papers.length === 0 ? (
                        <div className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500">
                            <LoaderCircle className="animate-spin" size={20} />
                            Loading past-question papers...
                        </div>
                    ) : filteredPapers.length === 0 ? (
                        <div className="px-5 py-14 text-center">
                            <BookOpen
                                size={38}
                                className="mx-auto text-gray-300"
                            />
                            <h3 className="mt-3 font-semibold text-gray-800">
                                No past-question papers found
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Add a paper using the form above or change your search filters.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredPapers.map((paper) => {
                                const course =
                                    paper.courseId &&
                                    typeof paper.courseId === "object"
                                        ? paper.courseId
                                        : null;

                                return (
                                    <div
                                        key={getId(paper)}
                                        className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between"
                                    >
                                        <div className="flex min-w-0 gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                                <FileText size={22} />
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="font-semibold text-gray-900">
                                                        {paper.title}
                                                    </h3>

                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusClass(paper.status)}`}
                                                    >
                                                        {paper.status || "draft"}
                                                    </span>
                                                </div>

                                                <p className="mt-1 text-sm text-gray-600">
                                                    {getCourseName(course)}
                                                </p>

                                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                                    <span>
                                                        Session: {paper.academicYear}
                                                    </span>

                                                    <span>
                                                        Semester:{" "}
                                                        {paper.semester === "not-specified"
                                                            ? "Not specified"
                                                            : paper.semester || "Not specified"}
                                                    </span>

                                                    {course?.department && (
                                                        <span>
                                                            {course.department}
                                                        </span>
                                                    )}
                                                </div>

                                                {paper.description && (
                                                    <p className="mt-2 max-w-2xl text-sm text-gray-500">
                                                        {paper.description}
                                                    </p>
                                                )}

                                                {paper.fileUrl && (
                                                    <a
                                                        href={paper.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                                                    >
                                                        <ExternalLink size={14} />
                                                        Open PDF
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                                            <a
                                                href={paper.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                                <Download size={15} />
                                                PDF
                                            </a>

                                            <button
                                                type="button"
                                                onClick={() => handleEdit(paper)}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50"
                                            >
                                                <Edit size={15} />
                                                Edit
                                            </button>

                                            {paper.status !== "published" && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleStatusChange(
                                                            paper,
                                                            "published"
                                                        )
                                                    }
                                                    className="rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700"
                                                >
                                                    Publish
                                                </button>
                                            )}

                                            {paper.status === "published" && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleStatusChange(
                                                            paper,
                                                            "draft"
                                                        )
                                                    }
                                                    className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50"
                                                >
                                                    Unpublish
                                                </button>
                                            )}

                                            {paper.status !== "archived" && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleStatusChange(
                                                            paper,
                                                            "archived"
                                                        )
                                                    }
                                                    className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100"
                                                >
                                                    Archive
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => handleDelete(paper)}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 size={15} />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
