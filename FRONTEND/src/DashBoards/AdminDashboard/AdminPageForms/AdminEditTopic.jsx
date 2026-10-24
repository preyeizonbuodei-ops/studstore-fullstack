import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  Save,
} from "lucide-react";
import useTopicStore from "../../UserDashboard/CourseStore/AdminTopicStore";

const getId = (item) => item?._id || item?.id || item;

const getTopicNumber = (topic) =>
  topic?.topicNumber ?? topic?.TopicNumber ?? topic?.topic_number ?? "";

const getTopicCourseId = (topic) =>
  getId(topic?.courseId) || getId(topic?.CourseId) || getId(topic?.course?._id);

const getTopicList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.topics)) return response.topics;
  if (Array.isArray(response?.topic)) return response.topic;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.topics)) return response.data.topics;
  if (Array.isArray(response?.data?.topic)) return response.data.topic;
  if (Array.isArray(response?.data?.data?.topics)) return response.data.data.topics;
  return [];
};

const getCourseLabel = (course, courseId) => {
  const label = [course?.courseCode, course?.courseTitle].filter(Boolean).join(" — ");
  if (label) return label;
  if (course?.name) return course.name;
  return courseId ? `Course ID: ${courseId}` : "Course not identified";
};

export default function AdminEditTopic() {
  const { topicId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const getTopicsByCourse = useTopicStore((state) => state.getTopicsByCourse);
  const updateTopic = useTopicStore((state) => state.updateTopic);

  const stateTopic = location.state?.topic;
  const stateCourse = location.state?.course;
  const stateCourseId = location.state?.courseId;
  const queryCourseId = searchParams.get("courseId");

  const [form, setForm] = useState({ title: "", topicNumber: "" });
  const [courseId, setCourseId] = useState("");
  const [courseLabel, setCourseLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    const applyTopic = (topic, knownCourseId = "", course = null) => {
      if (!topic || String(getId(topic)) !== String(topicId)) return false;
      const resolvedCourseId =
        getTopicCourseId(topic) || knownCourseId || queryCourseId || stateCourseId || "";
      if (cancelled) return true;

      setForm({
        title: topic.title || "",
        topicNumber: String(getTopicNumber(topic)),
      });
      setCourseId(String(resolvedCourseId || ""));
      setCourseLabel(getCourseLabel(course || topic.course || topic.Course, resolvedCourseId));
      return true;
    };

    const loadTopic = async () => {
      setLoading(true);
      setError("");
      setSuccess("");

      if (applyTopic(stateTopic, stateCourseId, stateCourse)) {
        setLoading(false);
        return;
      }

      const parentCourseId = queryCourseId || stateCourseId || getTopicCourseId(stateTopic);
      if (!parentCourseId) {
        setError(
          "The course ID is missing. Return to Course Management and open Edit Topic again."
        );
        setLoading(false);
        return;
      }

      try {
        const response = await getTopicsByCourse(parentCourseId);
        if (cancelled) return;

        const topics = getTopicList(response);
        const topic = topics.find((item) => String(getId(item)) === String(topicId));

        if (!topic) {
          throw new Error("Topic not found in the selected course.");
        }

        applyTopic(topic, parentCourseId, stateCourse);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message || err.message || "Unable to load this topic."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadTopic();
    return () => {
      cancelled = true;
    };
  }, [
    topicId,
    queryCourseId,
    stateTopic,
    stateCourse,
    stateCourseId,
    getTopicsByCourse,
  ]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const title = form.title.trim();
    const topicNumber = Number(form.topicNumber);

    if (!title) {
      setError("Enter a topic title.");
      return;
    }

    if (!courseId) {
      setError("The course linked to this topic could not be identified. Reopen this page from Course Management.");
      return;
    }

    if (!Number.isInteger(topicNumber) || topicNumber < 1) {
      setError("Topic number must be a whole number greater than zero.");
      return;
    }

    setSaving(true);
    try {
      await updateTopic(topicId, {
        courseId,
        title,
        topicNumber,
      });
      setSuccess("Topic updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update topic. Check that the backend PATCH /topics/:topicId route accepts courseId, title, and topicNumber."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-700"
        >
          <ArrowLeft size={17} /> Back to Course Management
        </button>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Academic Administration
          </p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Edit Topic</h1>
          <p className="mt-2 text-sm text-gray-500">
            Update the topic title or topic number. Lessons and their learning materials remain separate.
          </p>

          <div className="mt-4 rounded-lg bg-blue-50 px-3 py-3 text-sm text-blue-800">
            <span className="font-semibold">Course:</span> {courseLabel || "Loading course..."}
          </div>

          {error && (
            <div role="alert" className="mt-5 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div role="status" className="mt-5 flex gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
              <LoaderCircle size={18} className="animate-spin" /> Loading topic...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium text-gray-700">
                  Topic number
                  <input
                    required
                    type="number"
                    min="1"
                    step="1"
                    name="topicNumber"
                    value={form.topicNumber}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  Topic title
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
                  {saving ? <LoaderCircle size={17} className="animate-spin" /> : <Save size={17} />}
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
