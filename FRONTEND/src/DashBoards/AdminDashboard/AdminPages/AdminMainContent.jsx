import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
    BookOpen,
    CalendarDays,
    FolderOpen,
    Plus,
    Pen,
    Trash,
    ChevronDown,
    ChevronRight,
    FileText,
    Layers,
    Search,
    RefreshCw,
    GraduationCap,
    MessageSquareText,
    MessageCircle,
    ArrowRight,
    LoaderCircle,
} from "lucide-react";

import createCourseStore from "../../UserDashboard/CourseStore/CourseStore";
import useLessonStore from "../../UserDashboard/CourseStore/CreateLessonStore";
import useTopicStore from "../../UserDashboard/CourseStore/AdminTopicStore";
import useAdminCommentStore from "../../../Store/AdminCommentStore";

const COURSE_ROUTES = {
    addCourse: "/admin/create-course",
    editCourse: "/admin/edit-course",
    addLesson: "/admin/create-lesson",
    editLesson: "/admin/edit-lesson",
    addTopic: "/admin/create-topic",
    editTopic: "/admin/edit-topic",
};

const ADMIN_COMMENTS_ROUTE = "/admin-dashboard/comments";

const courseCategories = [
    { id: "general", label: "General Courses", icon: GraduationCap },
    { id: "first", label: "First Semester", icon: CalendarDays },
    { id: "second", label: "Second Semester", icon: CalendarDays },
];

const getCourseId = (course) => course?._id || course?.id;
const getTopicId = (topic) => topic?._id || topic?.id;
const getLessonId = (lesson) => lesson?._id || lesson?.id;

const getTopicNumber = (topic) =>
    topic?.TopicNumber ?? topic?.topicNumber ?? "—";

const getLessonNumber = (lesson) =>
    lesson?.LessonNumber ?? lesson?.lessonNumber ?? "—";

const getListFromResponse = (response, keys = []) => {
    const candidates = [
        response,
        response?.data,
        response?.data?.data,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            return candidate;
        }

        for (const key of keys) {
            if (Array.isArray(candidate?.[key])) {
                return candidate[key];
            }
        }
    }

    return [];
};

// Get the author's display name from a populated comment.
const getCommentAuthorName = (comment) => {
    const author = comment?.username;

    if (!author || typeof author !== "object") {
        return "StudStore Student";
    }

    const fullName = [
        author.firstName,
        author.lastName,
    ]
        .filter(Boolean)
        .join(" ")
        .trim();

    return (
        author.displayName ||
        author.fullName ||
        author.name ||
        fullName ||
        author.username ||
        "StudStore Student"
    );
};

// Format comment dates for the dashboard preview.
const formatCommentDate = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "";
    }

    return parsedDate.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

// Generate author initials.
const getCommentInitials = (name) =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("");

const AdminMainContent = () => {
    // Course stores.
    const getCourses = createCourseStore((state) => state.getCourses);
    const deleteCourse = createCourseStore((state) => state.deleteCourse);

    const getTopicsByCourse = useTopicStore(
        (state) => state.getTopicsByCourse
    );

    const deleteTopic = useTopicStore(
        (state) => state.deleteTopic
    );

    const getLessonsByTopic = useLessonStore(
        (state) => state.getLessonsByTopic
    );

    const deleteLesson = useLessonStore(
        (state) => state.deleteLesson
    );

    // Admin comment store.
    const getAllAdminComments = useAdminCommentStore(
        (state) => state.getAllComments
    );

    const adminComments = useAdminCommentStore(
        (state) => state.comments
    );

    const commentsLoading = useAdminCommentStore(
        (state) => state.loading
    );

    const commentsError = useAdminCommentStore(
        (state) => state.error
    );

    const [courses, setCourses] = useState([]);
    const [topics, setTopics] = useState([]);
    const [lessonsByTopic, setLessonsByTopic] = useState({});
    const [expandedTopics, setExpandedTopics] = useState({});

    const [activeCategory, setActiveCategory] = useState("general");
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [loadingCourses, setLoadingCourses] = useState(false);
    const [loadingTopics, setLoadingTopics] = useState(false);
    const [loadingLessonsByTopic, setLoadingLessonsByTopic] = useState({});
    const [errorMessage, setErrorMessage] = useState("");

    // Load courses.
    const loadCourses = useCallback(async () => {
        setLoadingCourses(true);
        setErrorMessage("");

        try {
            const response = await getCourses();
            const courseList = getListFromResponse(response, ["courses"]);

            setCourses(courseList);

            setSelectedCourseId((currentId) => {
                if (
                    currentId &&
                    courseList.some(
                        (course) => getCourseId(course) === currentId
                    )
                ) {
                    return currentId;
                }

                return getCourseId(courseList[0]) || null;
            });
        } catch (error) {
            console.error("LOAD COURSES ERROR:", error);

            setErrorMessage(
                error?.response?.data?.message ||
                    "Unable to load courses."
            );
        } finally {
            setLoadingCourses(false);
        }
    }, [getCourses]);

    useEffect(() => {
        loadCourses();
    }, [loadCourses]);

    // Load the four newest comments for the dashboard preview.
    useEffect(() => {
        getAllAdminComments({
            page: 1,
            limit: 4,
        }).catch((error) => {
            console.error("LOAD RECENT COMMENTS ERROR:", error);
        });
    }, [getAllAdminComments]);

    // Only display four comments in the dashboard preview.
    const recentAdminComments = adminComments.slice(0, 4);

    // Search and filter courses.
    const filteredCourses = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        return courses.filter((course) => {
            const searchableValues = [
                course?.courseCode,
                course?.courseTitle,
                typeof course?.department === "object"
                    ? course?.department?.name
                    : course?.department,
            ];

            const matchesSearch =
                !search ||
                searchableValues
                    .filter(Boolean)
                    .some((value) =>
                        String(value).toLowerCase().includes(search)
                    );

            let matchesCategory = false;

            if (activeCategory === "general") {
                matchesCategory = course?.courseType === "general";
            } else if (activeCategory === "first") {
                matchesCategory =
                    course?.courseType === "semester" &&
                    course?.semester === "first";
            } else {
                matchesCategory =
                    course?.courseType === "semester" &&
                    course?.semester === "second";
            }

            return matchesSearch && matchesCategory;
        });
    }, [courses, activeCategory, searchTerm]);

    const selectedCourse = courses.find(
        (course) => getCourseId(course) === selectedCourseId
    );

    // Load topics belonging to the selected course.
    // Hierarchy: Course -> Topic -> Lesson.
    useEffect(() => {
        let cancelled = false;

        const loadTopics = async () => {
            if (!selectedCourseId) {
                setTopics([]);
                setLessonsByTopic({});
                setExpandedTopics({});
                setLoadingTopics(false);
                setLoadingLessonsByTopic({});
                return;
            }

            setLoadingTopics(true);
            setErrorMessage("");
            setTopics([]);
            setLessonsByTopic({});
            setExpandedTopics({});
            setLoadingLessonsByTopic({});

            try {
                const response = await getTopicsByCourse(selectedCourseId);

                if (cancelled) return;

                setTopics(
                    getListFromResponse(response, ["topics", "topic"])
                );
            } catch (error) {
                if (cancelled) return;

                console.error("LOAD TOPICS ERROR:", error);

                setTopics([]);

                setErrorMessage(
                    error?.response?.data?.message ||
                        "Unable to load topics for this course."
                );
            } finally {
                if (!cancelled) {
                    setLoadingTopics(false);
                }
            }
        };

        loadTopics();

        return () => {
            cancelled = true;
        };
    }, [selectedCourseId, getTopicsByCourse]);

    // Load lessons belonging to one topic.
    const loadLessonsForTopic = async (topicId) => {
        if (!topicId) return;

        setLoadingLessonsByTopic((previous) => ({
            ...previous,
            [topicId]: true,
        }));

        setErrorMessage("");

        try {
            const response = await getLessonsByTopic(topicId);

            setLessonsByTopic((previous) => ({
                ...previous,
                [topicId]: getListFromResponse(response, [
                    "lessons",
                    "lesson",
                ]),
            }));
        } catch (error) {
            const status = error?.response?.status;
            const message = error?.response?.data?.message || "";

            // The backend returns 404 when a valid topic has no lessons.
            if (
                status === 404 &&
                /no lessons found/i.test(message)
            ) {
                setLessonsByTopic((previous) => ({
                    ...previous,
                    [topicId]: [],
                }));
                return;
            }

            console.error("LOAD LESSONS FOR TOPIC ERROR:", error);

            setErrorMessage(
                error?.response?.data?.message ||
                    "Unable to load lessons for this topic."
            );
        } finally {
            setLoadingLessonsByTopic((previous) => ({
                ...previous,
                [topicId]: false,
            }));
        }
    };

    const handleToggleTopic = async (topicId) => {
        const willExpand = !expandedTopics[topicId];

        setExpandedTopics((previous) => ({
            ...previous,
            [topicId]: willExpand,
        }));

        if (
            willExpand &&
            !Object.prototype.hasOwnProperty.call(
                lessonsByTopic,
                topicId
            )
        ) {
            await loadLessonsForTopic(topicId);
        }
    };

    const handleDeleteCourse = async (course) => {
        const courseId = getCourseId(course);

        if (
            !courseId ||
            !window.confirm(
                `Delete ${course.courseCode || course.courseTitle}?`
            )
        ) {
            return;
        }

        try {
            await deleteCourse(courseId);

            setSelectedCourseId(null);
            await loadCourses();
        } catch (error) {
            window.alert(
                error?.response?.data?.message ||
                    "Unable to delete course."
            );
        }
    };

    const handleDeleteTopic = async (topic) => {
        const topicId = getTopicId(topic);

        if (
            !topicId ||
            !window.confirm(`Delete topic "${topic.title}"?`)
        ) {
            return;
        }

        try {
            await deleteTopic(topicId);

            setTopics((previous) =>
                previous.filter(
                    (item) => getTopicId(item) !== topicId
                )
            );

            setLessonsByTopic((previous) => {
                const updated = { ...previous };
                delete updated[topicId];
                return updated;
            });

            setExpandedTopics((previous) => {
                const updated = { ...previous };
                delete updated[topicId];
                return updated;
            });
        } catch (error) {
            window.alert(
                error?.response?.data?.message ||
                    "Unable to delete topic. It may still contain lessons."
            );
        }
    };

    const handleDeleteLesson = async (lesson, topicId) => {
        const lessonId = getLessonId(lesson);

        if (
            !lessonId ||
            !window.confirm(`Delete lesson "${lesson.title}"?`)
        ) {
            return;
        }

        try {
            await deleteLesson(lessonId);

            setLessonsByTopic((previous) => ({
                ...previous,
                [topicId]: (previous[topicId] || []).filter(
                    (item) => getLessonId(item) !== lessonId
                ),
            }));
        } catch (error) {
            window.alert(
                error?.response?.data?.message ||
                    "Unable to delete lesson."
            );
        }
    };

    const getCourseLabel = (course) => {
        if (course?.courseType === "general") return "General";

        return course?.semester === "first"
            ? "First Semester"
            : "Second Semester";
    };

    const totalLessonsLoaded = Object.values(lessonsByTopic).reduce(
        (total, lessonList) =>
            total +
            (Array.isArray(lessonList) ? lessonList.length : 0),
        0
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="min-w-0 p-4 sm:p-6 lg:p-8">
                {/* Page header */}
                <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-600">
                            Academic Administration
                        </p>

                        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                            Course Management
                        </h1>

                        <p className="mt-2 text-sm text-gray-500">
                            Manage courses, topics, and lessons.
                        </p>
                    </div>

                    <NavLink
                        to={COURSE_ROUTES.addCourse}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                        <Plus size={17} />
                        Add Course
                    </NavLink>
                </div>

                {/* Course error message */}
                {errorMessage && (
                    <div
                        role="alert"
                        className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    >
                        <span>{errorMessage}</span>

                        <button
                            type="button"
                            onClick={loadCourses}
                            className="inline-flex items-center gap-2 font-medium"
                        >
                            <RefreshCw size={14} />
                            Retry courses
                        </button>
                    </div>
                )}

                {/* Summary cards */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                                Total Courses
                            </span>
                            <BookOpen className="text-blue-600" size={21} />
                        </div>

                        <p className="text-2xl font-bold text-gray-900">
                            {courses.length}
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                                Topics in Selected Course
                            </span>
                            <Layers className="text-purple-600" size={21} />
                        </div>

                        <p className="text-2xl font-bold text-gray-900">
                            {topics.length}
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                                Loaded Lessons
                            </span>
                            <FileText className="text-emerald-600" size={21} />
                        </div>

                        <p className="text-2xl font-bold text-gray-900">
                            {totalLessonsLoaded}
                        </p>
                    </div>
                </div>

                {/* Recent Student Comments */}
                <section className="mb-6 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <MessageSquareText size={22} />
                            </div>

                            <div>
                                <h2 className="font-bold text-gray-900">
                                    Recent Student Comments
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Review student feedback and respond to comments.
                                </p>
                            </div>
                        </div>

                        <NavLink
                            to={ADMIN_COMMENTS_ROUTE}
                            className="inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                        >
                            See more comments
                            <ArrowRight size={16} />
                        </NavLink>
                    </div>

                    <div className="p-4 sm:p-5">
                        {commentsLoading && recentAdminComments.length === 0 ? (
                            <div className="flex items-center justify-center gap-3 py-8 text-sm text-gray-500">
                                <LoaderCircle
                                    size={20}
                                    className="animate-spin text-blue-600"
                                />
                                Loading recent comments...
                            </div>
                        ) : commentsError && recentAdminComments.length === 0 ? (
                            <div
                                role="alert"
                                className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                            >
                                <p>{commentsError}</p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        getAllAdminComments({
                                            page: 1,
                                            limit: 4,
                                        }).catch(() => {})
                                    }
                                    className="mt-2 inline-flex items-center gap-2 font-semibold"
                                >
                                    <RefreshCw size={14} />
                                    Try again
                                </button>
                            </div>
                        ) : recentAdminComments.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-gray-200 px-4 py-10 text-center">
                                <MessageCircle
                                    size={30}
                                    className="mx-auto mb-3 text-gray-300"
                                />

                                <p className="text-sm font-semibold text-gray-700">
                                    No student comments yet
                                </p>

                                <p className="mt-1 text-sm text-gray-500">
                                    New student feedback will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentAdminComments.map((comment) => {
                                    const commentId = comment._id;
                                    const authorName =
                                        getCommentAuthorName(comment);

                                    const replyCount = Array.isArray(
                                        comment.replies
                                    )
                                        ? comment.replies.length
                                        : 0;

                                    return (
                                        <article
                                            key={commentId}
                                            className="rounded-xl border border-gray-100 p-4 transition hover:border-blue-100 hover:bg-gray-50/70"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                                                    {getCommentInitials(
                                                        authorName
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                        <h3 className="text-sm font-semibold text-gray-900">
                                                            {authorName}
                                                        </h3>

                                                        {comment.createdAt && (
                                                            <span className="text-xs text-gray-400">
                                                                {formatCommentDate(
                                                                    comment.createdAt
                                                                )}
                                                            </span>
                                                        )}

                                                        {comment.isDeleted && (
                                                            <span className="rounded-full bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700">
                                                                Removed
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p
                                                        className={`mt-2 whitespace-pre-wrap break-words text-sm leading-6 ${
                                                            comment.isDeleted
                                                                ? "italic text-gray-400"
                                                                : "text-gray-700"
                                                        }`}
                                                    >
                                                        {comment.comment}
                                                    </p>

                                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                                                            <MessageCircle size={14} />
                                                            {replyCount}{" "}
                                                            {replyCount === 1
                                                                ? "reply"
                                                                : "replies"}
                                                        </span>

                                                        <NavLink
                                                            to={ADMIN_COMMENTS_ROUTE}
                                                            className="text-xs font-semibold text-blue-600 transition hover:text-blue-800"
                                                        >
                                                            {comment.isDeleted
                                                                ? "View discussion"
                                                                : "View and manage"}
                                                        </NavLink>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}

                        {recentAdminComments.length > 0 && (
                            <div className="mt-4 flex justify-center border-t border-gray-100 pt-4">
                                <NavLink
                                    to={ADMIN_COMMENTS_ROUTE}
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-800"
                                >
                                    See all student comments
                                    <ArrowRight size={16} />
                                </NavLink>
                            </div>
                        )}
                    </div>
                </section>

                {/* Course category filters */}
                <div className="mb-6 flex flex-wrap gap-2">
                    {courseCategories.map((category) => {
                        const Icon = category.icon;
                        const active = activeCategory === category.id;

                        return (
                            <button
                                key={category.id}
                                type="button"
                                onClick={() =>
                                    setActiveCategory(category.id)
                                }
                                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                                    active
                                        ? "border-blue-600 bg-blue-600 text-white"
                                        : "border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600"
                                }`}
                            >
                                <Icon size={16} />
                                {category.label}
                            </button>
                        );
                    })}
                </div>

                {/* Main layout */}
                <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
                    {/* Course list */}
                    <section className="min-w-0 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="font-bold text-gray-900">
                                    Courses
                                </h2>

                                <p className="mt-1 text-xs text-gray-400">
                                    Select a course to manage its content
                                </p>
                            </div>

                            <FolderOpen
                                size={20}
                                className="text-blue-600"
                            />
                        </div>

                        <div className="relative mb-4">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />

                            <input
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(event.target.value)
                                }
                                placeholder="Search courses..."
                                aria-label="Search courses"
                                className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
                            />
                        </div>

                        {loadingCourses ? (
                            <p className="py-6 text-center text-sm text-gray-400">
                                Loading courses...
                            </p>
                        ) : filteredCourses.length === 0 ? (
                            <div className="rounded-lg bg-gray-50 px-3 py-8 text-center">
                                <BookOpen
                                    size={25}
                                    className="mx-auto mb-2 text-gray-300"
                                />

                                <p className="text-sm text-gray-500">
                                    No courses in this category.
                                </p>

                                <NavLink
                                    to={COURSE_ROUTES.addCourse}
                                    className="mt-3 inline-block text-xs font-medium text-blue-600"
                                >
                                    Add a course
                                </NavLink>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredCourses.map((course) => {
                                    const courseId = getCourseId(course);
                                    const isSelected =
                                        selectedCourseId === courseId;

                                    return (
                                        <button
                                            key={courseId}
                                            type="button"
                                            onClick={() =>
                                                setSelectedCourseId(courseId)
                                            }
                                            className={`w-full rounded-lg border p-3 text-left transition ${
                                                isSelected
                                                    ? "border-blue-200 bg-blue-50"
                                                    : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className={`rounded-lg p-2 ${
                                                        isSelected
                                                            ? "bg-blue-100 text-blue-600"
                                                            : "bg-gray-100 text-gray-500"
                                                    }`}
                                                >
                                                    <BookOpen size={17} />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p
                                                        className={`truncate text-sm font-semibold ${
                                                            isSelected
                                                                ? "text-blue-700"
                                                                : "text-gray-800"
                                                        }`}
                                                    >
                                                        {course.courseCode}
                                                    </p>

                                                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                                                        {course.courseTitle}
                                                    </p>

                                                    <span className="mt-2 inline-block rounded-md bg-white px-2 py-1 text-[10px] text-gray-500">
                                                        {getCourseLabel(course)}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* Selected course content */}
                    <section className="min-w-0 space-y-6">
                        {!selectedCourse ? (
                            <div className="rounded-xl border border-gray-100 bg-white p-10 text-center shadow-sm">
                                <BookOpen
                                    size={36}
                                    className="mx-auto mb-3 text-gray-300"
                                />

                                <h2 className="font-semibold text-gray-800">
                                    Select a course
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Choose a course from the list to view its topics and lessons.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Course information */}
                                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                            <GraduationCap size={31} />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                                                    {selectedCourse.courseCode}
                                                </span>

                                                <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
                                                    {getCourseLabel(selectedCourse)}
                                                </span>
                                            </div>

                                            <h2 className="mt-3 text-xl font-bold text-gray-900">
                                                {selectedCourse.courseTitle}
                                            </h2>

                                            <p className="mt-2 text-sm leading-6 text-gray-500">
                                                {selectedCourse.description ||
                                                    "No course description has been added."}
                                            </p>

                                            {selectedCourse.courseScope ===
                                                "department" && (
                                                <p className="mt-2 text-xs text-gray-500">
                                                    Department:{" "}
                                                    {typeof selectedCourse.department ===
                                                    "object"
                                                        ? selectedCourse.department?.name
                                                        : selectedCourse.department}
                                                </p>
                                            )}

                                            {selectedCourse.level && (
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Level: {selectedCourse.level}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex shrink-0 flex-wrap gap-2">
                                            <NavLink
                                                to={COURSE_ROUTES.editCourse}
                                                state={{
                                                    course: selectedCourse,
                                                    courseId: selectedCourseId,
                                                }}
                                                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                                            >
                                                <Pen size={14} />
                                                Edit
                                            </NavLink>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDeleteCourse(
                                                        selectedCourse
                                                    )
                                                }
                                                className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                                            >
                                                <Trash size={14} />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Topics belonging to the course */}
                                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900">
                                                Topics
                                            </h2>

                                            <p className="mt-1 text-xs text-gray-400">
                                                Topics are managed at the course level. Add topics here, then expand a topic to manage its lessons.
                                            </p>
                                        </div>

                                        <NavLink
                                            to={COURSE_ROUTES.addTopic}
                                            state={{
                                                courseId: selectedCourseId,
                                                course: selectedCourse,
                                            }}
                                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-medium text-white transition hover:bg-blue-700"
                                        >
                                            <Plus size={15} />
                                            Add Topic
                                        </NavLink>
                                    </div>

                                    {loadingTopics ? (
                                        <p className="py-8 text-center text-sm text-gray-400">
                                            Loading topics...
                                        </p>
                                    ) : topics.length === 0 ? (
                                        <div className="rounded-lg border border-dashed border-gray-200 px-4 py-10 text-center">
                                            <Layers
                                                size={30}
                                                className="mx-auto mb-3 text-gray-300"
                                            />

                                            <p className="text-sm font-medium text-gray-700">
                                                No topics yet
                                            </p>

                                            <p className="mt-1 text-xs text-gray-400">
                                                Add the first topic for this course.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {topics.map((topic) => {
                                                const topicId = getTopicId(topic);
                                                const isExpanded = Boolean(
                                                    expandedTopics[topicId]
                                                );
                                                const topicLessons =
                                                    lessonsByTopic[topicId] || [];

                                                const lessonsLoaded =
                                                    Object.prototype.hasOwnProperty.call(
                                                        lessonsByTopic,
                                                        topicId
                                                    );

                                                return (
                                                    <div
                                                        key={topicId}
                                                        className={`overflow-hidden rounded-lg border transition ${
                                                            isExpanded
                                                                ? "border-blue-200"
                                                                : "border-gray-200"
                                                        }`}
                                                    >
                                                        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleToggleTopic(
                                                                        topicId
                                                                    )
                                                                }
                                                                aria-expanded={isExpanded}
                                                                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                                            >
                                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                                                                    <Layers size={19} />
                                                                </div>

                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-xs text-gray-400">
                                                                        Topic{" "}
                                                                        {getTopicNumber(
                                                                            topic
                                                                        )}
                                                                    </p>

                                                                    <p className="mt-1 break-words text-sm font-semibold text-gray-800">
                                                                        {topic.title}
                                                                    </p>

                                                                    <p className="mt-1 text-xs text-gray-500">
                                                                        {lessonsLoaded
                                                                            ? `${topicLessons.length} lessons`
                                                                            : "Select to load lessons"}
                                                                    </p>
                                                                </div>

                                                                {isExpanded ? (
                                                                    <ChevronDown
                                                                        size={18}
                                                                        className="shrink-0 text-gray-400"
                                                                    />
                                                                ) : (
                                                                    <ChevronRight
                                                                        size={18}
                                                                        className="shrink-0 text-gray-400"
                                                                    />
                                                                )}
                                                            </button>

                                                            <div className="flex shrink-0 items-center gap-2 pl-12 sm:pl-0">
                                                                <NavLink
                                                                    to={COURSE_ROUTES.editTopic}
                                                                    state={{
                                                                        topic,
                                                                        course: selectedCourse,
                                                                        courseId: selectedCourseId,
                                                                    }}
                                                                    title="Edit topic"
                                                                    className="rounded-lg border border-blue-200 p-2 text-blue-600 hover:bg-blue-50"
                                                                >
                                                                    <Pen size={14} />
                                                                </NavLink>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleDeleteTopic(
                                                                            topic
                                                                        )
                                                                    }
                                                                    title="Delete topic"
                                                                    className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                                                                >
                                                                    <Trash size={14} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {isExpanded && (
                                                            <div className="border-t border-gray-100 bg-gray-50/70 p-4">
                                                                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                                                    <div>
                                                                        <h3 className="text-sm font-semibold text-gray-800">
                                                                            Lessons
                                                                        </h3>

                                                                        <p className="mt-1 text-xs text-gray-400">
                                                                            Learning content, examples, videos, and materials live inside lessons.
                                                                        </p>
                                                                    </div>

                                                                    <NavLink
                                                                        to={COURSE_ROUTES.addLesson}
                                                                        state={{
                                                                            topicId,
                                                                            topic,
                                                                            courseId: selectedCourseId,
                                                                            course: selectedCourse,
                                                                        }}
                                                                        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                                                                    >
                                                                        <Plus size={14} />
                                                                        Add Lesson
                                                                    </NavLink>
                                                                </div>

                                                                {loadingLessonsByTopic[topicId] ? (
                                                                    <p className="py-5 text-center text-sm text-gray-400">
                                                                        Loading lessons...
                                                                    </p>
                                                                ) : topicLessons.length === 0 ? (
                                                                    <div className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-7 text-center">
                                                                        <FileText
                                                                            size={25}
                                                                            className="mx-auto mb-2 text-gray-300"
                                                                        />

                                                                        <p className="text-sm text-gray-600">
                                                                            No lessons for this topic yet.
                                                                        </p>

                                                                        <p className="mt-1 text-xs text-gray-400">
                                                                            Add a lesson to provide the learning material.
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    <div className="space-y-2">
                                                                        {topicLessons.map(
                                                                            (lesson) => {
                                                                                const lessonId =
                                                                                    getLessonId(
                                                                                        lesson
                                                                                    );

                                                                                return (
                                                                                    <div
                                                                                        key={lessonId}
                                                                                        className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-white p-3 sm:flex-row sm:items-center"
                                                                                    >
                                                                                        <div className="flex min-w-0 flex-1 items-start gap-3">
                                                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                                                                                                <FileText size={15} />
                                                                                            </div>

                                                                                            <div className="min-w-0 flex-1">
                                                                                                <p className="text-[11px] text-gray-400">
                                                                                                    Lesson{" "}
                                                                                                    {getLessonNumber(
                                                                                                        lesson
                                                                                                    )}
                                                                                                </p>

                                                                                                <p className="mt-1 break-words text-sm font-medium text-gray-800">
                                                                                                    {lesson.title}
                                                                                                </p>
                                                                                            </div>
                                                                                        </div>

                                                                                        <div className="flex shrink-0 items-center gap-2 pl-11 sm:pl-0">
                                                                                            <NavLink
                                                                                                to={COURSE_ROUTES.editLesson}
                                                                                                state={{
                                                                                                    lesson,
                                                                                                    topic,
                                                                                                    topicId,
                                                                                                    course: selectedCourse,
                                                                                                    courseId: selectedCourseId,
                                                                                                }}
                                                                                                title="Edit lesson"
                                                                                                className="rounded-lg border border-blue-200 p-2 text-blue-600 hover:bg-blue-50"
                                                                                            >
                                                                                                <Pen size={14} />
                                                                                            </NavLink>

                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() =>
                                                                                                    handleDeleteLesson(
                                                                                                        lesson,
                                                                                                        topicId
                                                                                                    )
                                                                                                }
                                                                                                title="Delete lesson"
                                                                                                className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                                                                                            >
                                                                                                <Trash size={14} />
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            }
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default AdminMainContent;