
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Link2,
  LoaderCircle,
  Plus,
  Save,
  Video,
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

const getContentList = (response, type) => {
  const data = response?.data ?? response;
  const lesson = data?.lesson ?? data;

  if (Array.isArray(data?.[type])) return data[type];
  if (Array.isArray(lesson?.[type])) return lesson[type];

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

// Reusable form for adding videos, materials and resources
function LessonContentForm({
  title,
  description,
  icon: Icon,
  placeholder,
  form,
  onChange,
  onSubmit,
  saving,
  items,
  urlLabel,
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
          <Icon size={21} />
        </div>

        <div>
          <h3 className="font-semibold text-gray-900">
            {title}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            {description}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Title
          <input
            required
            type="text"
            maxLength={200}
            value={form.title}
            onChange={(event) =>
              onChange("title", event.target.value)
            }
            placeholder={`Enter ${title.toLowerCase()} title`}
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          {urlLabel}
          <input
            required
            type="url"
            value={form.url}
            onChange={(event) =>
              onChange("url", event.target.value)
            }
            placeholder={placeholder}
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <Plus size={17} />
          )}

          {saving ? "Adding..." : `Add ${title}`}
        </button>
      </form>

      <div className="mt-5 border-t border-gray-100 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-800">
            Existing {title}
          </h4>

          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
            {items.length}
          </span>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-gray-400">
            No {title.toLowerCase()} added to this lesson yet.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item._id || item.id || `${item.url}-${index}`}
                className="rounded-lg bg-gray-50 p-3"
              >
                <p className="break-words text-sm font-medium text-gray-800">
                  {item.title || `${title} ${index + 1}`}
                </p>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex max-w-full items-center gap-1 break-all text-xs text-blue-600 hover:underline"
                >
                  <Link2 size={13} className="shrink-0" />
                  {item.url}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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

  // New Zustand functions
  const addVideoToLesson = useLessonStore(
    (state) => state.addVideoToLesson
  );
  const addMaterialToLesson = useLessonStore(
    (state) => state.addMaterialToLesson
  );
  const addResourceToLesson = useLessonStore(
    (state) => state.addResourceToLesson
  );

  const getLessonVideos = useLessonStore(
    (state) => state.getLessonVideos
  );
  const getLessonMaterials = useLessonStore(
    (state) => state.getLessonMaterials
  );
  const getLessonResources = useLessonStore(
    (state) => state.getLessonResources
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

  const [contentForms, setContentForms] = useState({
    videos: { title: "", url: "" },
    materials: { title: "", url: "" },
    resources: { title: "", url: "" },
  });

  const [videos, setVideos] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [resources, setResources] = useState([]);

  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingContent, setSavingContent] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [contentError, setContentError] = useState("");
  const [contentSuccess, setContentSuccess] = useState("");

  // Load the lesson
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

  // Load existing videos, materials and resources
  useEffect(() => {
    let cancelled = false;

    const loadLessonContent = async () => {
      setContentLoading(true);
      setContentError("");

      try {
        const results = await Promise.all([
          getLessonVideos(lessonId),
          getLessonMaterials(lessonId),
          getLessonResources(lessonId),
        ]);

        if (cancelled) return;

        setVideos(getContentList(results[0], "videos"));
        setMaterials(getContentList(results[1], "materials"));
        setResources(getContentList(results[2], "resources"));
      } catch (err) {
        if (!cancelled) {
          setContentError(
            err.response?.data?.message ||
              "Unable to load the existing lesson videos, materials and resources."
          );
        }
      } finally {
        if (!cancelled) setContentLoading(false);
      }
    };

    if (lessonId) {
      loadLessonContent();
    }

    return () => {
      cancelled = true;
    };
  }, [
    lessonId,
    getLessonVideos,
    getLessonMaterials,
    getLessonResources,
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

  const handleContentChange = (type, field, value) => {
    setContentForms((current) => ({
      ...current,
      [type]: {
        ...current[type],
        [field]: value,
      },
    }));

    setContentError("");
    setContentSuccess("");
  };

  // Save lesson notes and examples
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

  // Add one video, material or resource
  const handleAddContent = async (type, event) => {
    event.preventDefault();

    setContentError("");
    setContentSuccess("");

    const title = contentForms[type].title.trim();
    const url = contentForms[type].url.trim();

    if (!title || !url) {
      setContentError("Both title and URL are required.");
      return;
    }

    const addFunctions = {
      videos: addVideoToLesson,
      materials: addMaterialToLesson,
      resources: addResourceToLesson,
    };

    const getFunctions = {
      videos: getLessonVideos,
      materials: getLessonMaterials,
      resources: getLessonResources,
    };

    const addFunction = addFunctions[type];
    const getFunction = getFunctions[type];

    if (typeof addFunction !== "function") {
      setContentError(
        `The add ${type} function is missing from LessonStore.`
      );
      return;
    }

    setSavingContent(type);

    try {
      await addFunction(lessonId, { title, url });

      // Refresh only the category that was changed
      const response = await getFunction(lessonId);
      const updatedItems = getContentList(response, type);

      if (type === "videos") {
        setVideos(updatedItems);
      } else if (type === "materials") {
        setMaterials(updatedItems);
      } else if (type === "resources") {
        setResources(updatedItems);
      }

      setContentForms((current) => ({
        ...current,
        [type]: { title: "", url: "" },
      }));

      setContentSuccess(
        `${type.charAt(0).toUpperCase() + type.slice(1, -1)} added successfully.`
      );
    } catch (err) {
      setContentError(
        err.response?.data?.message ||
          `Unable to add ${type}. Please try again.`
      );
    } finally {
      setSavingContent("");
    }
  };

  const courseLabel = getCourseLabel(stateCourse);
  const topicLabel = stateTopic?.title || "Selected topic";

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
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
            Edit the lesson number, title, content and worked
            examples. Videos, materials and resources can be
            managed separately below.
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

          {!loading && (
            <div className="mt-10 border-t border-gray-200 pt-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Lesson Content Management
                </p>

                <h2 className="mt-2 text-xl font-bold text-gray-900">
                  Manage Videos, Materials and Resources
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Add content to this existing lesson without
                  changing its notes or creating another lesson.
                </p>
              </div>

              {contentError && (
                <div
                  role="alert"
                  className="mt-5 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />
                  <span>{contentError}</span>
                </div>
              )}

              {contentSuccess && (
                <div
                  role="status"
                  className="mt-5 flex gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
                >
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0"
                  />
                  <span>{contentSuccess}</span>
                </div>
              )}

              {contentLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                  Loading existing lesson content...
                </div>
              ) : (
                <div className="mt-6 grid gap-5 lg:grid-cols-2">
                  <LessonContentForm
                    title="Videos"
                    description="Add YouTube videos or other video links."
                    icon={Video}
                    placeholder="https://www.youtube.com/watch?v=..."
                    urlLabel="Video URL"
                    form={contentForms.videos}
                    onChange={(field, value) =>
                      handleContentChange("videos", field, value)
                    }
                    onSubmit={(event) =>
                      handleAddContent("videos", event)
                    }
                    saving={savingContent === "videos"}
                    items={videos}
                  />

                  <LessonContentForm
                    title="Materials"
                    description="Add lecture notes, PDFs and downloadable study materials."
                    icon={FileText}
                    placeholder="https://example.com/material.pdf"
                    urlLabel="Material URL"
                    form={contentForms.materials}
                    onChange={(field, value) =>
                      handleContentChange("materials", field, value)
                    }
                    onSubmit={(event) =>
                      handleAddContent("materials", event)
                    }
                    saving={savingContent === "materials"}
                    items={materials}
                  />

                  <LessonContentForm
                    title="Resources"
                    description="Add useful external learning resources and reference links."
                    icon={Link2}
                    placeholder="https://example.com/resource"
                    urlLabel="Resource URL"
                    form={contentForms.resources}
                    onChange={(field, value) =>
                      handleContentChange("resources", field, value)
                    }
                    onSubmit={(event) =>
                      handleAddContent("resources", event)
                    }
                    saving={savingContent === "resources"}
                    items={resources}
                  />
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
