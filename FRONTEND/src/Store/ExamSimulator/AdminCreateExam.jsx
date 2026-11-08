
import { useEffect, useState } from "react";
import axios from "axios";
import { BookOpen, FileText, LoaderCircle, Save } from "lucide-react";
import { useAdminExamStore } from "./AdminExamStore";

const API_URL = import.meta.env.DEV
  ? "http://localhost:8000/api/v1/admin"
  : "https://api.studstore.com.ng/api/v1/admin";

axios.defaults.withCredentials = true;

const initialForm = {
  title: "",
  description: "",
  courseId: "",
  topicId: "",
  examMode: "practice",
  duration: 30,
  instructions: "",
};

const getId = (item) => item?._id || item?.id || "";

export default function AdminCreateExam() {
  const [form, setForm] = useState(initialForm);
  const [courses, setCourses] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [formError, setFormError] = useState("");

  const createExam = useAdminExamStore((state) => state.createExam);
  const loading = useAdminExamStore((state) => state.loading);
  const error = useAdminExamStore((state) => state.error);
  const successMessage = useAdminExamStore(
    (state) => state.successMessage
  );
  const clearMessages = useAdminExamStore(
    (state) => state.clearMessages
  );
  const currentExam = useAdminExamStore((state) => state.currentExam);

  useEffect(() => {
    let cancelled = false;

    const loadCourses = async () => {
      setLoadingCourses(true);
      setFormError("");

      try {
        const response = await axios.get(`${API_URL}/get-courses`);
        const courseList = response.data.courses || [];

        if (!cancelled) {
          setCourses(courseList);
        }
      } catch (err) {
        if (!cancelled) {
          setFormError(
            err.response?.data?.message ||
              "Unable to load courses. Check your admin login."
          );
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
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadTopics = async () => {
      if (!form.courseId) {
        setTopics([]);
        return;
      }

      setLoadingTopics(true);
      setFormError("");

      try {
        const response = await axios.get(
          `${API_URL}/course/${form.courseId}/topics`
        );

        if (!cancelled) {
          setTopics(response.data.topics || []);
        }
      } catch (err) {
        if (!cancelled) {
          setTopics([]);
          setFormError(
            err.response?.data?.message ||
              "Unable to load topics for this course."
          );
        }
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
  }, [form.courseId]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    clearMessages();
    setFormError("");

    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "courseId" ? { topicId: "" } : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearMessages();
    setFormError("");

    if (!form.title.trim()) {
      setFormError("Enter an exam title.");
      return;
    }

    if (!form.courseId) {
      setFormError("Select a course.");
      return;
    }

    if (
      form.examMode === "cbt" &&
      (!Number.isFinite(Number(form.duration)) ||
        Number(form.duration) < 1)
    ) {
      setFormError("A timed CBT exam must have a duration of at least 1 minute.");
      return;
    }

    const examData = {
      title: form.title.trim(),
      description: form.description.trim(),
      courseId: form.courseId,
      topicId: form.topicId || null,
      examMode: form.examMode,
      instructions: form.instructions.trim(),
    };

    if (form.examMode === "cbt") {
      examData.duration = Number(form.duration);
    }

    const result = await createExam(examData);

    if (result.success) {
      setForm(initialForm);
      setTopics([]);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-7">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <BookOpen size={25} />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Create Examination
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Create a draft exam for an existing StudStore course or topic.
            You can add questions before publishing it.
          </p>
        </div>

        {(formError || error) && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {formError || error}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            {successMessage}
            {currentExam && (
              <p className="mt-1">
                Exam ID: {getId(currentExam)}
              </p>
            )}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8"
        >
          <section className="space-y-4">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900">
              <FileText size={19} className="text-blue-600" />
              Exam details
            </h2>

            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Exam title
              </label>

              <input
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                maxLength={200}
                required
                placeholder="e.g. CHM 101 Practice Examination"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                maxLength={2000}
                rows={3}
                placeholder="What will this examination cover?"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </section>

          <section className="space-y-4 border-t border-gray-100 pt-6">
            <h2 className="font-semibold text-gray-900">
              Course and topic
            </h2>

            <div>
              <label
                htmlFor="courseId"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Select course
              </label>

              <select
                id="courseId"
                name="courseId"
                value={form.courseId}
                onChange={handleChange}
                required
                disabled={loadingCourses}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">
                  {loadingCourses ? "Loading courses..." : "Choose a course"}
                </option>

                {courses.map((course) => (
                  <option key={getId(course)} value={getId(course)}>
                    {course.courseCode
                      ? `${course.courseCode} - ${course.courseTitle}`
                      : course.courseTitle}
                  </option>
                ))}
              </select>

              {!loadingCourses && courses.length === 0 && (
                <p className="mt-2 text-sm text-amber-700">
                  No courses were returned. Make sure you are logged in as an admin and have created a course.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="topicId"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Exam scope
              </label>

              <select
                id="topicId"
                name="topicId"
                value={form.topicId}
                onChange={handleChange}
                disabled={!form.courseId || loadingTopics}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">
                  Entire course
                </option>

                {topics.map((topic) => (
                  <option key={getId(topic)} value={getId(topic)}>
                    {topic.TopicNumber
                      ? `${topic.TopicNumber}. ${topic.title}`
                      : topic.title}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-gray-500">
                Choose a topic to restrict the exam to that topic, or leave
                it as Entire course.
              </p>

              {loadingTopics && (
                <p className="mt-2 text-xs text-gray-500">
                  Loading topics...
                </p>
              )}
            </div>
          </section>

          <section className="space-y-4 border-t border-gray-100 pt-6">
            <h2 className="font-semibold text-gray-900">
              Examination settings
            </h2>

            <div>
              <label
                htmlFor="examMode"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Exam mode
              </label>

              <select
                id="examMode"
                name="examMode"
                value={form.examMode}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="practice">
                  Practice mode
                </option>
                <option value="cbt">
                  Timed CBT examination
                </option>
              </select>

              <p className="mt-2 text-xs text-gray-500">
                Practice mode is untimed. Timed CBT uses a server-controlled deadline.
              </p>
            </div>

            {form.examMode === "cbt" && (
              <div>
                <label
                  htmlFor="duration"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Duration (minutes)
                </label>

                <input
                  id="duration"
                  name="duration"
                  type="number"
                  min="1"
                  step="1"
                  value={form.duration}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="instructions"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Instructions for students
              </label>

              <textarea
                id="instructions"
                name="instructions"
                value={form.instructions}
                onChange={handleChange}
                maxLength={5000}
                rows={4}
                placeholder="Enter exam instructions..."
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </section>

          <div className="border-t border-gray-100 pt-5">
            <button
              type="submit"
              disabled={loading || loadingCourses || !courses.length}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {loading ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}

              {loading ? "Creating exam..." : "Save as draft"}
            </button>

            <p className="mt-3 text-xs text-gray-500">
              Saving creates a draft only. You must add questions before publishing.
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
