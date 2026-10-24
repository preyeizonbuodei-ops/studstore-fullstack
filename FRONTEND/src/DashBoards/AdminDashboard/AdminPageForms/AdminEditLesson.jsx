
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  Save,
} from "lucide-react";
import useLessonStore from "../../UserDashboard/CourseStore/LessonStore";

const getId = (item) => item?._id || item?.id || item;

const getLessonNumber = (lesson) =>
  lesson?.lessonNumber ?? lesson?.LessonNumber ?? "";

const getLessonList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.lessons)) return response.lessons;
  if (Array.isArray(response?.lesson)) return response.lesson;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.lessons)) return response.data.lessons;
  if (Array.isArray(response?.data?.lesson)) return response.data.lesson;
  return [];
};

const getCourseLabel = (course) => {
  if (!course) return "Course information unavailable";

  const label = [
    course.courseCode,
    course.courseTitle,
  ].filter(Boolean).join(" — ");

  return label || course.title || course.name || "Course";
};

export default function AdminEditLesson() {
  const { lessonId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const getLessons = useLessonStore((state) => state.getLessons);
  const getLessonsByTopic = useLessonStore(
    (state) => state.getLessonsByTopic
  );
  const updateLesson = useLessonStore(
    (state) => state.updateLesson
  );

  const stateLesson = location.state?.lesson;
  const stateTopic = location.state?.topic;
  const stateCourse = location.state?.course;
  const stateTopicId =
    location.state?.topicId || getId(stateTopic);

  const [form, setForm] = useState({
    lessonNumber: "",
    title: "",
    content: "",
    examples: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    const applyLesson = (lesson) => {
      if (
        !lesson ||
        String(getId(lesson)) !== String(lessonId)
      ) {
        return false;
      }

      setForm({
        lessonNumber: String(getLessonNumber(lesson)),
        title: lesson.title || "",
        content:
          typeof lesson.content === "string"
            ? lesson.content
            : lesson.content == null
              ? ""
              : JSON.stringify(lesson.content, null, 2),
        examples:
          typeof lesson.examples === "string"
            ? lesson.examples
            : lesson.examples == null
              ? ""
              : JSON.stringify(lesson.examples, null, 2),
      });

      return true;
    };

    const loadLesson = async () => {
      setLoading(true);
      setError("");
      setSuccess("");

      if (applyLesson(stateLesson)) {
        setLoading(false);
        return;
      }

      try {
        let lessons = [];

        if (
          stateTopicId &&
          typeof getLessonsByTopic === "function"
        ) {
          try {
            lessons = getLessonList(
              await getLessonsByTopic(stateTopicId)
            );
          } catch {
            lessons = [];
          }
        }

        if (!lessons.length) {
          if (typeof getLessons !== "function") {
            throw new Error(
              "The getLessons method is missing from LessonStore."
            );
          }

          lessons = getLessonList(await getLessons());
        }

        if (cancelled) return;

        const lesson = lessons.find(
          (item) => String(getId(item)) === String(lessonId)
        );

        if (!lesson || !applyLesson(lesson)) {
          throw new Error(
            "Lesson not found. Return to Course Management and open Edit Lesson again."
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load this lesson."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadLesson();

    return () => {
      cancelled = true;
    };
  }, [
    lessonId,
    stateLesson,
    stateTopicId,
    getLessons,
    getLessonsByTopic,
  ]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const title = form.title.trim();
    const content = form.content.trim();
    const lessonNumber = Number(form.lessonNumber);

    if (!title) {
      setError("Enter a lesson title.");
      return;
    }

    if (
      !Number.isInteger(lessonNumber) ||
      lessonNumber < 1
    ) {
      setError(
        "Lesson number must be a whole number greater than zero."
      );
      return;
    }

    if (!content) {
      setError("Enter the lesson content.");
      return;
    }

    if (typeof updateLesson !== "function") {
      setError(
        "The updateLesson method is missing from LessonStore."
      );
      return;
    }

    setSaving(true);

    try {
      // Videos, materials, and resources are not sent by this form.
      await updateLesson(lessonId, {
        lessonNumber,
        title,
        content: form.content,
        examples: form.examples,
      });

      setSuccess("Lesson updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update lesson. Check the lesson update route and controller."
      );
    } finally {
      setSaving(false);
    }
  };

  const courseLabel = getCourseLabel(stateCourse);
  const topicLabel = stateTopic?.title || "Selected topic";

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Back to Course Management
        </button>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Academic Administration
          </p>

          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            Edit Lesson
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Edit the lesson number, title, content, and worked
            examples. This form does not edit videos, materials,
            or resources.
          </p>

          <div className="mt-5 grid gap-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-900 sm:grid-cols-2">
            <p>
              <span className="font-semibold">Course:</span>{" "}
              {courseLabel}
            </p>

            <p>
              <span className="font-semibold">Topic:</span>{" "}
              {topicLabel}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mt-5 flex gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
            >
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0"
              />
              <span>{success}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
              Loading lesson...
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-5"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium text-gray-700">
                  Lesson number
                  <input
                    required
                    type="number"
                    min="1"
                    step="1"
                    name="lessonNumber"
                    value={form.lessonNumber}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  Lesson title
                  <input
                    required
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    maxLength={200}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
                  Lesson content
                  <textarea
                    required
                    rows={14}
                    name="content"
                    value={form.content}
                    onChange={handleChange}
                    placeholder="Edit the lesson notes..."
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-3 font-mono text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
                  Worked examples (optional)
                  <textarea
                    rows={7}
                    name="examples"
                    value={form.examples}
                    onChange={handleChange}
                    placeholder="Edit worked examples, if applicable..."
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-3 font-mono text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  disabled={saving || loading}
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={17} />
                  )}

                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
