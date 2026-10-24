
import { useEffect, useState } from "react";
import { useParams, NavLink } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Layers,
} from "lucide-react";

import useTopicStore from "../../CourseStore/UserTopicStore";
import useCourseStore from "../../CourseStore/GetCourseStore";

const TopicsPage = () => {
    const { courseId } = useParams();

    const [topics, setTopics] = useState([]);
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const getTopicsByCourse = useTopicStore(
        (state) => state.getTopicsByCourse
    );

    const getCourseById = useCourseStore(
        (state) => state.getCourseById
    );

    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            setLoading(true);
            setError("");

            try {
                const [courseResult, topicsResult] =
                    await Promise.allSettled([
                        getCourseById(courseId),
                        getTopicsByCourse(courseId),
                    ]);

                if (cancelled) return;

                // Load course information.
                if (courseResult.status === "fulfilled") {
                    const response = courseResult.value;

                    setCourse(
                        response?.course ??
                        response?.data?.course ??
                        null
                    );
                } else {
                    console.error(
                        "GET COURSE ERROR:",
                        courseResult.reason?.response?.data ||
                        courseResult.reason
                    );

                    setCourse(null);
                }

                // Load topics belonging to this course.
                if (topicsResult.status === "fulfilled") {
                    const response = topicsResult.value;

                    const topicList =
                        response?.topics ??
                        response?.data?.topics ??
                        response?.data?.data?.topics ??
                        (Array.isArray(response) ? response : []);

                    setTopics(
                        Array.isArray(topicList) ? topicList : []
                    );
                } else {
                    console.error(
                        "GET TOPICS BY COURSE ERROR:",
                        topicsResult.reason?.response?.data ||
                        topicsResult.reason
                    );

                    setTopics([]);

                    setError(
                        topicsResult.reason?.response?.data?.message ||
                        "Unable to load topics. Please try again."
                    );
                }
            } catch (err) {
                if (!cancelled) {
                    console.error("LOAD COURSE CONTENT ERROR:", err);

                    setTopics([]);
                    setError(
                        "Unable to load course content. Please try again."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        if (courseId) {
            fetchData();
        } else {
            setTopics([]);
            setCourse(null);
            setError("Course ID is missing.");
            setLoading(false);
        }

        return () => {
            cancelled = true;
        };
    }, [courseId, getTopicsByCourse, getCourseById]);

    return (
        <div className="w-full p-4 sm:p-6 lg:p-8">

            {/* Back to Courses */}
            <NavLink
                to="/me/courses"
                className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-950 transition-colors hover:text-amber-500"
            >
                <ArrowLeft size={18} />
                Back to Courses
            </NavLink>

            {/* Course Header */}
            <div className="mb-8 rounded-2xl bg-blue-950 p-6 text-white sm:p-8">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-white/10 p-3">
                        <BookOpen size={24} />
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-blue-200">
                            {course?.courseCode || "Course"}
                        </p>

                        <h1 className="text-2xl font-bold sm:text-3xl">
                            {course?.courseTitle || "Course Topics"}
                        </h1>
                    </div>
                </div>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-100">
                    Explore the topics in this course. Select a topic to
                    view its lessons, study notes, worked examples,
                    videos, and learning materials.
                </p>
            </div>

            {/* Section Heading */}
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                    Course Topics
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                    Select a topic to explore its lessons.
                </p>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex min-h-[250px] items-center justify-center">
                    <div className="text-center">
                        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-950" />

                        <p className="mt-4 text-sm text-gray-500">
                            Loading topics...
                        </p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {!loading && error && (
                <div
                    role="alert"
                    className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center"
                >
                    <h2 className="text-lg font-bold text-red-800">
                        Could not load topics
                    </h2>

                    <p className="mt-2 text-sm text-red-700">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="mt-4 rounded-lg bg-blue-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && topics.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
                    <Layers
                        size={40}
                        className="mx-auto text-gray-400"
                    />

                    <h2 className="mt-4 text-lg font-bold text-gray-700">
                        No topics available
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                        Topics for this course haven't been added yet.
                    </p>
                </div>
            )}

            {/* Topics */}
            {!loading && !error && topics.length > 0 && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {topics.map((topic, index) => {
                        const topicNumber =
                            topic.TopicNumber ??
                            topic.topicNumber ??
                            index + 1;

                        return (
                            <div
                                key={topic._id || topic.id}
                                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg sm:p-6"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-950 transition group-hover:bg-blue-950 group-hover:text-white">
                                        <Layers size={22} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                            Topic {topicNumber}
                                        </p>

                                        <h3 className="mt-1 break-words text-lg font-bold text-blue-950">
                                            {topic.title || "Untitled Topic"}
                                        </h3>
                                    </div>
                                </div>

                                <div className="mt-5 border-t border-gray-100 pt-4">
                                    <NavLink
                                        to={`/topics/${topic._id || topic.id}/lessons`}
                                        state={{
                                            course,
                                            courseId,
                                            topic,
                                        }}
                                        className="flex items-center justify-between gap-3 rounded-lg bg-blue-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                                    >
                                        <span>View Lessons</span>
                                        <ArrowRight size={18} />
                                    </NavLink>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TopicsPage;
