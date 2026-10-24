
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, BookOpen, Layers, LoaderCircle } from "lucide-react";

import createCourseStore from "../../UserDashboard/CourseStore/CourseStore";
import useTopicStore from "../../UserDashboard/CourseStore/AdminTopicStore";

const getCourseId = (course) => course?._id || course?.id || "";

const getListFromResponse = (response) => {
    const candidates = [
        response,
        response?.data,
        response?.data?.data,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) return candidate;
        if (Array.isArray(candidate?.courses)) return candidate.courses;
    }

    return [];
};

const CreateTopicForm = () => {
    const location = useLocation();

    const getCourses = createCourseStore(
        (state) => state.getCourses
    );

    const createTopic = useTopicStore(
        (state) => state.createTopic
    );

    const initialCourseId =
        location.state?.courseId ||
        getCourseId(location.state?.course) ||
        "";

    const [courses, setCourses] = useState([]);
    const [courseId, setCourseId] = useState(initialCourseId);
    const [topicNumber, setTopicNumber] = useState("");
    const [title, setTitle] = useState("");

    const [loadingCourses, setLoadingCourses] = useState(true);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadCourses = async () => {
            setLoadingCourses(true);

            try {
                const response = await getCourses();

                if (cancelled) return;

                const courseList = getListFromResponse(response);
                setCourses(courseList);

                setCourseId((currentId) => {
                    if (
                        currentId &&
                        courseList.some(
                            (course) =>
                                String(getCourseId(course)) ===
                                String(currentId)
                        )
                    ) {
                        return currentId;
                    }

                    return getCourseId(courseList[0]) || "";
                });
            } catch (error) {
                if (!cancelled) {
                    console.error(
                        "LOAD COURSES FOR TOPIC FORM ERROR:",
                        error?.response?.data || error
                    );

                    setMessage(
                        error?.response?.data?.message ||
                            "Unable to load courses. Check your admin login and backend."
                    );
                    setMessageType("error");
                }
            } finally {
                if (!cancelled) {
                    setLoadingCourses(false);
                }
            }
        };

        loadCourses();

        return () => {
            cancelled = true;
        };
    }, [getCourses]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        setMessage("");

        if (!courseId) {
            setMessage("Please select a course.");
            setMessageType("error");
            return;
        }

        const number = Number(topicNumber);

        if (!Number.isInteger(number) || number < 1) {
            setMessage("Enter a valid topic number greater than zero.");
            setMessageType("error");
            return;
        }

        if (!title.trim()) {
            setMessage("Please enter a topic title.");
            setMessageType("error");
            return;
        }

        if (typeof createTopic !== "function") {
            setMessage("The topic store is missing createTopic.");
            setMessageType("error");
            return;
        }

        setLoading(true);

        try {
            const response = await createTopic(courseId, {
                TopicNumber: number,
                title: title.trim(),
            });

            if (response?.success === false) {
                throw new Error(
                    response.message || "Failed to create topic."
                );
            }

            setMessage(
                response?.message || "Topic created successfully."
            );
            setMessageType("success");

            setTopicNumber("");
            setTitle("");
        } catch (error) {
            console.error(
                "CREATE COURSE TOPIC ERROR:",
                error?.response?.data || error
            );

            setMessage(
                error?.response?.data?.message ||
                    error?.message ||
                    "Failed to create topic."
            );
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    const selectedCourse = courses.find(
        (course) =>
            String(getCourseId(course)) === String(courseId)
    );

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl">
                <Link
                    to="/admin-dashboard"
                    className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
                >
                    <ArrowLeft size={17} />
                    Back to Course Management
                </Link>

                <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <header className="bg-blue-950 p-6 text-white sm:p-8">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-white/10 p-3">
                                <Layers size={25} />
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold">
                                    Create Topic
                                </h1>
                                <p className="mt-1 text-sm text-blue-100">
                                    Add a topic to a course.
                                </p>
                            </div>
                        </div>
                    </header>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-6 p-6 sm:p-8"
                    >
                        <div>
                            <label
                                htmlFor="courseId"
                                className="mb-2 block text-sm font-semibold text-gray-800"
                            >
                                Course
                            </label>

                            <select
                                id="courseId"
                                value={courseId}
                                onChange={(event) =>
                                    setCourseId(event.target.value)
                                }
                                disabled={loadingCourses || loading}
                                required
                                className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="">
                                    {loadingCourses
                                        ? "Loading courses..."
                                        : "Select a course"}
                                </option>

                                {courses.map((course) => (
                                    <option
                                        key={getCourseId(course)}
                                        value={getCourseId(course)}
                                    >
                                        {course.courseCode || "Course"} —{" "}
                                        {course.courseTitle || "Untitled Course"}
                                    </option>
                                ))}
                            </select>

                            {selectedCourse && (
                                <p className="mt-2 text-xs text-gray-500">
                                    Topic will belong to{" "}
                                    <span className="font-semibold">
                                        {selectedCourse.courseCode} —{" "}
                                        {selectedCourse.courseTitle}
                                    </span>
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="topicNumber"
                                className="mb-2 block text-sm font-semibold text-gray-800"
                            >
                                Topic Number
                            </label>

                            <input
                                id="topicNumber"
                                type="number"
                                min="1"
                                step="1"
                                value={topicNumber}
                                onChange={(event) =>
                                    setTopicNumber(event.target.value)
                                }
                                placeholder="e.g. 1"
                                required
                                className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="title"
                                className="mb-2 block text-sm font-semibold text-gray-800"
                            >
                                Topic Title
                            </label>

                            <input
                                id="title"
                                type="text"
                                value={title}
                                onChange={(event) =>
                                    setTitle(event.target.value)
                                }
                                placeholder="e.g. Introduction to Chemistry"
                                required
                                maxLength={200}
                                className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                            <div className="flex items-start gap-3">
                                <BookOpen
                                    size={20}
                                    className="mt-0.5 shrink-0 text-blue-700"
                                />

                                <div>
                                    <p className="text-sm font-semibold text-blue-950">
                                        What happens next?
                                    </p>
                                    <p className="mt-1 text-sm leading-6 text-blue-800">
                                        After creating this topic, open it in
                                        Course Management to add its lessons.
                                        Teaching notes, examples, videos, and
                                        study materials belong to individual
                                        lessons.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {message && (
                            <div
                                role="status"
                                className={`rounded-lg border p-3 text-sm ${
                                    messageType === "success"
                                        ? "border-green-200 bg-green-50 text-green-800"
                                        : "border-red-200 bg-red-50 text-red-800"
                                }`}
                            >
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={
                                loading ||
                                loadingCourses ||
                                courses.length === 0
                            }
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <LoaderCircle
                                        size={18}
                                        className="animate-spin"
                                    />
                                    Creating Topic...
                                </>
                            ) : (
                                <>
                                    <PlusIcon />
                                    Create Topic
                                </>
                            )}
                        </button>
                    </form>
                </section>
            </div>
        </main>
    );
};

function PlusIcon() {
    return <Layers size={18} />;
}

export default CreateTopicForm;
