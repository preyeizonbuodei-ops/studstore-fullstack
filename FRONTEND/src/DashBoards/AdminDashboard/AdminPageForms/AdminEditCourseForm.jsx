import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, LoaderCircle, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import createCourseStore from "../../UserDashboard/CourseStore/CourseStore";

const emptyForm = {
  courseType: "general",
  courseScope: "shared",
  level: "100",
  courseTitle: "",
  courseCode: "",
  semester: "first",
  description: "",
};

const getId = (item) => item?._id || item?.id;
const getList = (response, key) => {
  if (Array.isArray(response)) return response;
  return response?.[key] || response?.data?.[key] || response?.data?.data?.[key] || [];
};

function toForm(course) {
  return {
    courseType: course?.courseType || "general",
    courseScope: course?.courseScope || "shared",
    level: course?.level == null ? "100" : String(course.level),
    courseTitle: course?.courseTitle || "",
    courseCode: course?.courseCode || "",
    semester: course?.semester || "first",
    description: course?.description || "",
  };
}

export default function AdminEditCourse() {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const getCourses = createCourseStore((state) => state.getCourses);
  const updateCourse = createCourseStore((state) => state.updateCourse);

  const [form, setForm] = useState(emptyForm);
  const [departmentLabel, setDepartmentLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    const applyCourse = (course) => {
      if (!course || String(getId(course)) !== String(courseId)) return false;
      if (cancelled) return true;
      setForm(toForm(course));
      const department = course.department;
      setDepartmentLabel(
        typeof department === "object"
          ? department?.name || department?.departmentName || department?.title || "Assigned department"
          : department || "Not assigned"
      );
      return true;
    };

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        if (applyCourse(location.state?.course)) return;
        const response = await getCourses();
        const courses = getList(response, "courses");
        const course = courses.find((item) => String(getId(item)) === String(courseId));
        if (!course) throw new Error("Course not found. Return to Course Management and open Edit again.");
        applyCourse(course);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || err.message || "Unable to load this course.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [courseId, getCourses, location.state]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        courseType: form.courseType,
        courseScope: form.courseScope,
        level: form.level,
        courseTitle: form.courseTitle.trim(),
        courseCode: form.courseCode.trim(),
        description: form.description.trim(),
      };
      if (form.courseType === "semester") payload.semester = form.semester;
      await updateCourse(courseId, payload);
      setSuccess("Course updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update course. Check the backend update route and try again.");
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => navigate(-1);

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <button type="button" onClick={goBack} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-700">
          <ArrowLeft size={17} /> Back to Course Management
        </button>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Academic Administration</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Edit Course</h1>
          <p className="mt-2 text-sm text-gray-500">Update the course details. Existing lesson and topic records are not changed by this form.</p>

          {error && <div role="alert" className="mt-5 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={18} className="shrink-0" />{error}</div>}
          {success && <div role="status" className="mt-5 flex gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"><CheckCircle2 size={18} className="shrink-0" />{success}</div>}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500"><LoaderCircle className="animate-spin" size={18} />Loading course...</div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium text-gray-700">Course code
                  <input required name="courseCode" value={form.courseCode} onChange={handleChange} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </label>
                <label className="block text-sm font-medium text-gray-700">Course title
                  <input required name="courseTitle" value={form.courseTitle} onChange={handleChange} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </label>
                <label className="block text-sm font-medium text-gray-700">Course type
                  <select name="courseType" value={form.courseType} onChange={handleChange} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500">
                    <option value="general">General course</option><option value="semester">Semester course</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-gray-700">Course scope
                  <select name="courseScope" value={form.courseScope} onChange={handleChange} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500">
                    <option value="shared">Shared</option><option value="department">Department</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-gray-700">Level
                  <select name="level" value={form.level} onChange={handleChange} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500">
                    {[100, 200, 300, 400, 500].map((level) => <option key={level} value={String(level)}>{level} Level</option>)}
                  </select>
                </label>
                {form.courseType === "semester" && <label className="block text-sm font-medium text-gray-700">Semester
                  <select name="semester" value={form.semester} onChange={handleChange} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500">
                    <option value="first">First semester</option><option value="second">Second semester</option>
                  </select>
                </label>}
                <label className="block text-sm font-medium text-gray-700 sm:col-span-2">Department assignment <span className="font-normal text-gray-400">(not changed on this form)</span>
                  <input readOnly value={departmentLabel} className="mt-2 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-500" />
                </label>
                <label className="block text-sm font-medium text-gray-700 sm:col-span-2">Description
                  <textarea name="description" rows={5} value={form.description} onChange={handleChange} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </label>
              </div>
              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button type="button" onClick={goBack} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button disabled={saving} type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? <LoaderCircle size={17} className="animate-spin" /> : <Save size={17} />} {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
