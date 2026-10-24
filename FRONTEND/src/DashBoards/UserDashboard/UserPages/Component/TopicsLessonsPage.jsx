
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    GraduationCap,
    Search,
    Layers3,
    AlertCircle,
    PlayCircle,
} from "lucide-react";

import LessonStore from "../../CourseStore/LessonStore";
import useTopicStore from "../../CourseStore/UserTopicStore";

const getLessonId = (lesson) => lesson?._id || lesson?.id;

const getLessonNumber = (lesson, index) =>
    lesson?.LessonNumber ?? lesson?.lessonNumber ?? index + 1;

const getList = (response) => {
    const value =
        response?.lessons ??
        response?.data?.lessons ??
        response?.data?.data?.lessons ??
        (Array.isArray(response) ? response : []);

    return Array.isArray(value) ? value : [];
};

const TopicLessonsPage = () => {
    const { topicId } = useParams();
    const navigate = useNavigate();

    const getLessonsByTopic = LessonStore(
        (state) => state.getLessonsByTopic
    );

    const getTopicById = useTopicStore(
        (state) => state.getTopicById
    );

    const [topic, setTopic] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const fetchTopicAndLessons = async () => {
            if (!topicId) {
                setError("Topic ID is missing from the page URL.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError("");
            setTopic(null);
            setLessons([]);

            try {
                const [topicResponse, lessonResponse] =
                    await Promise.all([
                        getTopicById(topicId),
                        getLessonsByTopic(topicId),
                    ]);

                if (cancelled) return;

                const topicData =
                    topicResponse?.topic ??
                    topicResponse?.data?.topic ??
                    topicResponse?.data?.data?.topic ??
                    null;

                if (!topicData) {
                    throw new Error("The selected topic could not be found.");
                }

                setTopic(topicData);
                setLessons(getList(lessonResponse));
            } catch (err) {
                if (cancelled) return;

                const status = err?.response?.status;
                const message =
                    err?.response?.data?.message ||
                    err?.message ||
                    "";

                // An empty topic is a valid state.
                if (
                    status === 404 &&
                    /no lessons found/i.test(message)
                ) {
                    setLessons([]);
                    setError("");

                    try {
                        const topicResponse = await getTopicById(topicId);

                        if (cancelled) return;

                        const topicData =
                            topicResponse?.topic ??
                            topicResponse?.data?.topic ??
                            topicResponse?.data?.data?.topic ??
                            null;

                        if (!topicData) {
                            throw new Error("The selected topic could not be found.");
                        }

                        setTopic(topicData);
                    } catch (topicError) {
                        if (cancelled) return;

                        setError(
                            topicError?.response?.data?.message ||
                            topicError?.message ||
                            "Unable to load this topic."
                        );
                    }

                    return;
                }

                console.error(
                    "LOAD TOPIC LESSONS ERROR:",
                    err?.response?.data || err
                );

                setError(
                    err?.response?.data?.message ||
                    err?.message ||
                    "Unable to load this topic and its lessons."
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchTopicAndLessons();

        return () => {
            cancelled = true;
        };
    }, [topicId, getTopicById, getLessonsByTopic]);

    const filteredLessons = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        if (!search) return lessons;

        return lessons.filter((lesson) =>
            [
                lesson?.title,
                lesson?.content,
                lesson?.examples,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(search)
        );
    }, [lessons, searchTerm]);

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            <div className="mx-auto max-w-5xl">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"
                >
                    <ArrowLeft size={18} />
                    Back to Course Topics
                </button>

                <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-blue-800 to-indigo-700 px-5 py-8 text-white shadow-lg sm:px-8 sm:py-10">
                    <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border-[35px] border-white/10" />

                    <div className="relative z-10">
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-blue-100">
                            <GraduationCap size={17} />
                            YOUR LEARNING SPACE
                        </div>

                        <h1 className="break-words text-3xl font-extrabold tracking-tight sm:text-4xl">
                            {topic?.title || "Topic Lessons"}
                        </h1>

                        <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
                            Select a lesson to open its notes, worked
                            examples, videos, and study materials.
                        </p>

                        <div className="mt-6 inline-flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                            <Layers3 size={20} />
                            <div>
                                <p className="text-lg font-bold">
                                    {lessons.length}
                                </p>
                                <p className="text-xs text-blue-100">
                                    {lessons.length === 1 ? "Lesson" : "Lessons"} in this topic
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mb-6">
                    <h2 className="text-2xl font-extrabold text-slate-900">
                        Available Lessons
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                        Choose a lesson to view its learning content.
                    </p>

                    <div className="relative mt-4 w-full sm:max-w-md">
                        <Search
                            size={19}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(event.target.value)
                            }
                            placeholder="Search lessons..."
                            aria-label="Search lessons"
                            className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                    </div>
                </section>

                {loading && (
                    <div className="flex min-h-[220px] items-center justify-center">
                        <div className="text-center">
                            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-800" />
                            <p className="mt-4 text-sm text-slate-500">
                                Loading topic lessons...
                            </p>
                        </div>
                    </div>
                )}

                {!loading && error && (
                    <div
                        role="alert"
                        className="rounded-2xl border border-red-200 bg-white px-5 py-10 text-center"
                    >
                        <AlertCircle
                            size={36}
                            className="mx-auto mb-3 text-red-500"
                        />

                        <h3 className="text-lg font-bold text-slate-900">
                            Couldn’t load this topic
                        </h3>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="mt-5 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {!loading && !error && lessons.length === 0 && (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
                        <BookOpen
                            size={38}
                            className="mx-auto mb-4 text-slate-400"
                        />

                        <h3 className="text-xl font-bold text-slate-900">
                            No lessons in this topic yet
                        </h3>

                        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
                            Lessons have not been added to this topic yet.
                            Return to the course and choose another topic.
                        </p>
                    </div>
                )}

                {!loading && !error && filteredLessons.length > 0 && (
                    <div className="space-y-4">
                        {filteredLessons.map((lesson, index) => {
                            const lessonId = getLessonId(lesson);
                            const lessonNumber = getLessonNumber(lesson, index);

                            return (
                                <article
                                    key={lessonId || index}
                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md"
                                >
                                    <div className="flex items-center gap-4 p-5 sm:p-6">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-950">
                                            {lessonNumber}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                Lesson {lessonNumber}
                                            </p>

                                            <h3 className="mt-1 break-words text-base font-bold text-blue-950 sm:text-lg">
                                                {lesson?.title || "Untitled Lesson"}
                                            </h3>

                                            <p className="mt-1 text-sm text-slate-500">
                                                Open notes and learning resources
                                            </p>
                                        </div>

                                        {lessonId ? (
                                            <Link
                                                to={`/lessons/${lessonId}`}
                                                state={{
                                                    topicId,
                                                    topicTitle: topic?.title,
                                                }}
                                                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-950 px-3 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 sm:px-4"
                                            >
                                                <span className="hidden sm:inline">
                                                    Start Lesson
                                                </span>
                                                <PlayCircle size={18} />
                                                <ArrowRight size={17} />
                                            </Link>
                                        ) : (
                                            <span className="text-xs text-red-600">
                                                Lesson ID missing
                                            </span>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                {!loading &&
                    !error &&
                    lessons.length > 0 &&
                    filteredLessons.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                            <Search
                                size={32}
                                className="mx-auto mb-3 text-slate-400"
                            />

                            <h3 className="font-bold text-slate-900">
                                No matching lessons
                            </h3>

                            <button
                                type="button"
                                onClick={() => setSearchTerm("")}
                                className="mt-4 text-sm font-semibold text-blue-700 hover:text-blue-900"
                            >
                                Clear Search
                            </button>
                        </div>
                    )}

                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-800 hover:text-blue-950"
                >
                    <ArrowLeft size={17} />
                    Back to Topics
                    <ArrowRight size={16} />
                </button>
            </div>
        </main>
    );
};

export default TopicLessonsPage;
