import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Layers,
  Link as LinkIcon,
  Plus,
  Trash2,
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
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const createEmptyMaterial = () => ({
  title: "",
  url: "",
});

const isValidWebUrl = (value) => {
  try {
    const parsedUrl = new URL(value);

    return (
      parsedUrl.protocol === "http:" ||
      parsedUrl.protocol === "https:"
    );
  } catch {
    return false;
  }
};

const CreateLessonForm = () => {
  const location = useLocation();

  const getCourses = createCourseStore(
    (state) => state.getCourses
  );

  const getTopicsByCourse = useTopicStore(
    (state) => state.getTopicsByCourse
  );

  const createLesson = useLessonStore(
    (state) => state.createLesson
  );

  const initialCourseId =
    location.state?.courseId ||
    getCourseId(location.state?.course);

  const initialTopicId =
    location.state?.topicId ||
    getTopicId(location.state?.topic);

  const [courses, setCourses] = useState([]);
  const [topics, setTopics] = useState([]);

  const [courseId, setCourseId] = useState(
    initialCourseId || ""
  );

  const [topicId, setTopicId] = useState(
    initialTopicId || ""
  );

  const [formData, setFormData] = useState({
    title: "",
    lessonNumber: "",
    content: "",
    examples: "",
    videos: "",
    materials: [createEmptyMaterial()],
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

        const courseList = getListFromResponse(
          response,
          "courses"
        );

        setCourses(courseList);

        setCourseId((currentId) => {
          const preferredId = currentId || initialCourseId;

          if (
            preferredId &&
            courseList.some(
              (course) =>
                String(getCourseId(course)) ===
                String(preferredId)
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

        const topicList = getListFromResponse(
          response,
          "topics"
        );

        setTopics(topicList);

        setTopicId((currentId) => {
          const preferredId = currentId || initialTopicId;

          if (
            preferredId &&
            topicList.some(
              (topic) =>
                String(getTopicId(topic)) ===
                String(preferredId)
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

  // Update an individual study material.
  const handleMaterialChange = (index, field, value) => {
    setFormData((previous) => ({
      ...previous,
      materials: previous.materials.map((material, i) =>
        i === index
          ? {
              ...material,
              [field]: value,
            }
          : material
      ),
    }));

    setServerError("");
    setSuccessMessage("");
  };

  // Add another title and URL pair.
  const handleAddMaterial = () => {
    setFormData((previous) => ({
      ...previous,
      materials: [
        ...previous.materials,
        createEmptyMaterial(),
      ],
    }));

    setServerError("");
    setSuccessMessage("");
  };

  // Remove a material row without leaving the form empty.
  const handleRemoveMaterial = (index) => {
    setFormData((previous) => ({
      ...previous,
      materials:
        previous.materials.length === 1
          ? [createEmptyMaterial()]
          : previous.materials.filter(
              (_, i) => i !== index
            ),
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

    if (
      !formData.lessonNumber.trim() ||
      !Number.isInteger(number) ||
      number < 1
    ) {
      setServerError(
        "Enter a valid lesson number greater than zero."
      );
      return;
    }

    if (!formData.content.trim()) {
      setServerError("Please enter the lesson notes.");
      return;
    }

    if (typeof createLesson !== "function") {
      setServerError(
        "The lesson creation function is unavailable."
      );
      return;
    }

    // Validate material title and URL pairs.
    const enteredMaterials = formData.materials
      .map((material) => ({
        title: material.title.trim(),
        url: material.url.trim(),
      }))
      .filter((material) => material.title || material.url);

    for (let i = 0; i < enteredMaterials.length; i += 1) {
      const material = enteredMaterials[i];

      if (!material.title) {
        setServerError(
          `Please enter a title for Study Material ${i + 1}.`
        );
        return;
      }

      if (!material.url) {
        setServerError(
          `Please enter the file URL for "${material.title}".`
        );
        return;
      }

      if (!isValidWebUrl(material.url)) {
        setServerError(
          `Enter a valid HTTP or HTTPS URL for "${material.title}".`
        );
        return;
      }
    }

    // Keep the user-friendly multiline video field,
    // but submit videos in the object format required by Joi.
    const videoUrls = splitLines(formData.videos);

    for (const url of videoUrls) {
      if (!isValidWebUrl(url)) {
        setServerError(
          `Invalid video URL: ${url}`
        );
        return;
      }
    }

    const formattedVideos = videoUrls.map((url, index) => ({
      title: `Video ${index + 1}`,
      url,
    }));

    // Keep the multiline additional-resource field,
    // and submit resources as title/URL objects.
    const resourceUrls = splitLines(formData.resources);

    for (const url of resourceUrls) {
      if (!isValidWebUrl(url)) {
        setServerError(
          `Invalid additional resource URL: ${url}`
        );
        return;
      }
    }

    const formattedResources = resourceUrls.map(
      (url, index) => ({
        title: `Resource ${index + 1}`,
        url,
      })
    );

    const lessonData = {
      topicId,
      title: formData.title.trim(),
      lessonNumber: number,
      content: formData.content.trim(),
      examples: formData.examples.trim(),
      videos: formattedVideos,
      materials: enteredMaterials,
      resources: formattedResources,
    };

    setSubmitting(true);

    try {
      const response = await createLesson(lessonData);

      if (response?.success === false) {
        throw new Error(
          response.message || "Unable to create lesson."
        );
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
        materials: [createEmptyMaterial()],
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
    (course) =>
      String(getCourseId(course)) === String(courseId)
  );

  const selectedTopic = topics.find(
    (topic) =>
      String(getTopicId(topic)) === String(topicId)
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
                  {loadingCourses
                    ? "Loading courses..."
                    : "Select a course"}
                </option>

                {courses.map((course) => (
                  <option
                    key={getCourseId(course)}
                    value={getCourseId(course)}
                  >
                    {course.courseCode || course.code || "Course"}
                    {" — "}
                    {course.courseTitle ||
                      course.title ||
                      course.name ||
                      ""}
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
                    {topic.TopicNumber ??
                      topic.topicNumber ??
                      ""}{" "}
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
              required
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
              Add one video URL per line. Video titles are generated
              automatically.
            </p>
          </div>

          {/* Study materials */}
          <div className="mb-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <FileText size={17} />
                Study Materials
              </label>

              <span className="text-xs text-gray-500">
                {formData.materials.length}{" "}
                {formData.materials.length === 1
                  ? "material field"
                  : "material fields"}
              </span>
            </div>

            <p className="mb-4 text-sm text-gray-500">
              Give each material a clear title, then paste its direct
              PDF or document URL underneath.
            </p>

            <div className="space-y-4">
              {formData.materials.map((material, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-blue-950">
                      Study Material {index + 1}
                    </h3>

                    <button
                      type="button"
                      onClick={() => handleRemoveMaterial(index)}
                      disabled={submitting}
                      aria-label={`Remove study material ${index + 1}`}
                      title="Remove material"
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                      Remove
                    </button>
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor={`material-title-${index}`}
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Material Title
                    </label>

                    <input
                      id={`material-title-${index}`}
                      type="text"
                      value={material.title}
                      onChange={(event) =>
                        handleMaterialChange(
                          index,
                          "title",
                          event.target.value
                        )
                      }
                      disabled={submitting}
                      placeholder="PHY 101 — Physical Quantities and Measurements"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-950"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`material-url-${index}`}
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      PDF or Document URL
                    </label>

                    <input
                      id={`material-url-${index}`}
                      type="url"
                      value={material.url}
                      onChange={(event) =>
                        handleMaterialChange(
                          index,
                          "url",
                          event.target.value
                        )
                      }
                      disabled={submitting}
                      placeholder="https://example.com/physics-lecture-note.pdf"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-950"
                    />

                    <p className="mt-2 text-xs text-gray-500">
                      Use a link students can open to read the study
                      material.
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddMaterial}
              disabled={submitting}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-blue-950 px-4 py-2.5 text-sm font-semibold text-blue-950 transition hover:bg-blue-50 disabled:opacity-50"
            >
              <Plus size={17} />
              Add Another Study Material
            </button>
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

            <p className="mt-1 text-xs text-gray-500">
              Add one URL per line. Resource titles are generated
              automatically.
            </p>
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