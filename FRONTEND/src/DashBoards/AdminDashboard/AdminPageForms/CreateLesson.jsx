import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Layers,
  Link as LinkIcon,
  Plus,
  Video,
} from "lucide-react";

import createCourseStore from "../../UserDashboard/CourseStore/CourseStore";
import useTopicStore from "../../UserDashboard/CourseStore/AdminTopicStore";
import useLessonStore from "../../UserDashboard/CourseStore/CreateLessonStore";

const getCourseId = (course) => course?._id || course?.id || "";

const getTopicId = (topic) => topic?._id || topic?.id || "";

const getListFromResponse = (response, key) => {
  const candidates = [
    response,
    response?.data,
    response?.data?.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (Array.isArray(candidate?.[key])) {
      return candidate[key];
    }
  }

  return [];
};

const splitLines = (value) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const CreateLessonForm = () => {
  const location = useLocation();

  const getCourses = createCourseStore((state) => state.getCourses);
  const getTopicsByCourse = useTopicStore(
    (state) => state.getTopicsByCourse
  );
  const createLesson = useLessonStore((state) => state.createLesson);

  const initialCourseId =
    location.state?.courseId ||
    getCourseId(location.state?.course);

  const initialTopicId =
    location.state?.topicId ||
    getTopicId(location.state?.topic);

  const [courses, setCourses] = useState([]);
  const [topics, setTopics] = useState([]);

  const [courseId, setCourseId] = useState(initialCourseId || "");
  const [topicId, setTopicId] = useState(initialTopicId || "");

  const [formData, setFormData] = useState({
    title: "",
    lessonNumber: "",
    content: "",
    examples: "",
    videos: "",
    materials: "",
    resources: "",
  });

  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Load available courses.
  useEffect(() => {
    let cancelled = false;

    const fetchCourses = async () => {
      setLoadingCourses(true);
      setServerError("");

      try {
        const response = await getCourses();
        if (cancelled) return;

        const courseList = getListFromResponse(response, "courses");
        setCourses(courseList);

        setCourseId((currentId) => {
          const preferredId = currentId || initialCourseId;

          if (
            preferredId &&
            courseList.some(
              (course) =>
                String(getCourseId(course)) === String(preferredId)
            )
          ) {
            return String(preferredId);
          }

          return String(getCourseId(courseList[0]) || "");
        });
      } catch (error) {
        if (!cancelled) {
          console.error(
            "LOAD COURSES FOR LESSON FORM ERROR:",
            error?.response?.data || error
          );

          setServerError(
            error?.response?.data?.message ||
              "Unable to load courses. Check your admin login and try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingCourses(false);
        }
      }
    };

    fetchCourses();

    return () => {
      cancelled = true;
    };
  }, [getCourses, initialCourseId]);

  // Load topics belonging to the selected course.
  useEffect(() => {
    let cancelled = false;

    const fetchTopics = async () => {
      if (!courseId) {
        setTopics([]);
        setTopicId("");
        setLoadingTopics(false);
        return;
      }

      setLoadingTopics(true);
      setTopics([]);

      try {
        const response = await getTopicsByCourse(courseId);
        if (cancelled) return;

        const topicList = getListFromResponse(response, "topics");
        setTopics(topicList);

        setTopicId((currentId) => {
          const preferredId = currentId || initialTopicId;

          if (
            preferredId &&
            topicList.some(
              (topic) =>
                String(getTopicId(topic)) === String(preferredId)
            )
          ) {
            return String(preferredId);
          }

          return "";
        });
      } catch (error) {
        if (!cancelled) {
          console.error(
            "LOAD TOPICS FOR LESSON FORM ERROR:",
            error?.response?.data || error
          );

          setTopics([]);
          setTopicId("");
          setServerError(
            error?.response?.data?.message ||
              "Unable to load topics for this course."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingTopics(false);
        }
      }
    };

    fetchTopics();

    return () => {
      cancelled = true;
    };
  }, [courseId, getTopicsByCourse, initialTopicId]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setServerError("");
    setSuccessMessage("");
  };

  const handleCourseChange = (event) => {
    setCourseId(event.target.value);
    setTopicId("");
    setServerError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    setServerError("");
    setSuccessMessage("");

    if (!courseId) {
      setServerError("Please select a course.");
      return;
    }

    if (!topicId) {
      setServerError("Please select a topic for this lesson.");
      return;
    }

    if (!formData.title.trim()) {
      setServerError("Please enter a lesson title.");
      return;
    }

    const number = Number(formData.lessonNumber);

    if (!Number.isInteger(number) || number < 1) {
      setServerError("Enter a valid lesson number greater than zero.");
      return;
    }

    if (typeof createLesson !== "function") {
      setServerError("The lesson creation function is unavailable.");
      return;
    }

    const lessonData = {
      topicId,
      title: formData.title.trim(),
      lessonNumber: number,
      content: formData.content.trim(),
      examples: formData.examples.trim(),
      videos: splitLines(formData.videos),
      materials: splitLines(formData.materials),
      resources: splitLines(formData.resources),
    };

    setSubmitting(true);

    try {
      const response = await createLesson(lessonData);

      if (response?.success === false) {
        throw new Error(response.message || "Unable to create lesson.");
      }

      setSuccessMessage(
        response?.message || "Lesson created successfully."
      );

      setFormData({
        title: "",
        lessonNumber: "",
        content: "",
        examples: "",
        videos: "",
        materials: "",
        resources: "",
      });
    } catch (error) {
      console.error(
        "CREATE LESSON ERROR:",
        error?.response?.data || error
      );

      setServerError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to create lesson."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCourse = courses.find(
    (course) => String(getCourseId(course)) === String(courseId)
  );

  const selectedTopic = topics.find(
    (topic) => String(getTopicId(topic)) === String(topicId)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-4xl">
        <Link
          to="/admin-dashboard"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-blue-950 hover:text-blue-700"
        >
          <ArrowLeft size={18} />
          Back to Admin Dashboard
        </Link>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-950">
              <BookOpen size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-blue-950 sm:text-3xl">
                Create Lesson
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Add a lesson under a topic in a course.
              </p>
            </div>
          </div>

          {successMessage && (
            <div
              role="status"
              className="mb-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700"
            >
              {successMessage}
            </div>
          )}

          {serverError && (
            <div
              role="alert"
              className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {serverError}
            </div>
          )}

          {/* Course selection */}
          <div className="mb-6">
            <label
              htmlFor="courseId"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Course
            </label>

            <div className="relative">
              <BookOpen
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <select
                id="courseId"
                name="courseId"
                value={courseId}
                onChange={handleCourseChange}
                disabled={loadingCourses || submitting}
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-950 focus:bg-white disabled:opacity-60"
              >
                <option value="">
                  {loadingCourses ? "Loading courses..." : "Select a course"}
                </option>

                {courses.map((course) => (
                  <option
                    key={getCourseId(course)}
                    value={getCourseId(course)}
                  >
                    {course.courseCode || course.code || "Course"}{" "}
                    {" — "}
                    {course.courseTitle || course.title || course.name || ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Topic selection */}
          <div className="mb-6">
            <label
              htmlFor="topicId"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Topic
            </label>

            <div className="relative">
              <Layers
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <select
                id="topicId"
                name="topicId"
                value={topicId}
                onChange={(event) => {
                  setTopicId(event.target.value);
                  setServerError("");
                  setSuccessMessage("");
                }}
                disabled={
                  !courseId ||
                  loadingTopics ||
                  submitting ||
                  topics.length === 0
                }
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-950 focus:bg-white disabled:opacity-60"
              >
                <option value="">
                  {!courseId
                    ? "Select a course first"
                    : loadingTopics
                    ? "Loading topics..."
                    : topics.length === 0
                    ? "No topics found for this course"
                    : "Select a topic"}
                </option>

                {topics.map((topic) => (
                  <option
                    key={getTopicId(topic)}
                    value={getTopicId(topic)}
                  >
                    {topic.TopicNumber ?? topic.topicNumber ?? ""}{" "}
                    {topic.title || topic.name || "Untitled Topic"}
                  </option>
                ))}
              </select>
            </div>

            {selectedCourse && selectedTopic && (
              <p className="mt-2 text-xs text-gray-500">
                This lesson will be added to{" "}
                <span className="font-semibold">
                  {selectedCourse.courseCode ||
                    selectedCourse.courseTitle ||
                    selectedCourse.title ||
                    "the selected course"}
                </span>{" "}
                under{" "}
                <span className="font-semibold">
                  {selectedTopic.title}
                </span>
                .
              </p>
            )}
          </div>

          {/* Lesson title and number */}
          <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Lesson Title
              </label>

              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="Introduction to Robotics"
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-blue-950 focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="lessonNumber"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Lesson Number
              </label>

              <input
                id="lessonNumber"
                name="lessonNumber"
                type="number"
                min="1"
                step="1"
                value={formData.lessonNumber}
                onChange={handleChange}
                placeholder="1"
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-blue-950 focus:bg-white"
              />
            </div>
          </div>

          {/* Lesson notes */}
          <div className="mb-6">
            <label
              htmlFor="content"
              className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"
            >
              <FileText size={17} />
              Lesson Notes
            </label>

            <textarea
              id="content"
              name="content"
              rows={7}
              value={formData.content}
              onChange={handleChange}
              placeholder="Enter the lesson notes..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-blue-950 focus:bg-white"
            />
          </div>

          {/* Worked examples */}
          <div className="mb-6">
            <label
              htmlFor="examples"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Examples and Explanations
            </label>

            <textarea
              id="examples"
              name="examples"
              rows={5}
              value={formData.examples}
              onChange={handleChange}
              placeholder="Add worked examples or additional explanations..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-blue-950 focus:bg-white"
            />
          </div>

          {/* Video links */}
          <div className="mb-6">
            <label
              htmlFor="videos"
              className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"
            >
              <Video size={17} />
              Video Links
            </label>

            <textarea
              id="videos"
              name="videos"
              rows={3}
              value={formData.videos}
              onChange={handleChange}
              placeholder="Paste video links, one per line"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-blue-950 focus:bg-white"
            />
            <p className="mt-1 text-xs text-gray-500">
              Add one video URL per line.
            </p>
          </div>

          {/* Study materials */}
          <div className="mb-6">
            <label
              htmlFor="materials"
              className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"
            >
              <FileText size={17} />
              Study Materials
            </label>

            <textarea
              id="materials"
              name="materials"
              rows={3}
              value={formData.materials}
              onChange={handleChange}
              placeholder="Paste direct PDF or document links, one per line"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-blue-950 focus:bg-white"
            />
            <p className="mt-1 text-xs text-gray-500">
              Use direct links to files students can open and read.
            </p>
          </div>

          {/* Additional resources */}
          <div className="mb-8">
            <label
              htmlFor="resources"
              className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700"
            >
              <LinkIcon size={17} />
              Additional Resources
            </label>

            <textarea
              id="resources"
              name="resources"
              rows={3}
              value={formData.resources}
              onChange={handleChange}
              placeholder="Paste additional resource links, one per line"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-blue-950 focus:bg-white"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={
                submitting ||
                loadingCourses ||
                loadingTopics ||
                !courseId ||
                !topicId
              }
              className="inline-flex items-center gap-2 rounded-xl bg-blue-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Create Lesson
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLessonForm;