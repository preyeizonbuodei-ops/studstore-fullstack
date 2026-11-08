
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, FileText } from "lucide-react";

import { useQuestionBankStore } from "../../../../Store/ExamSimulator/QuestionBankStore";
import createCourseStore from "../../../UserDashboard/CourseStore/CourseStore";

const UploadPastQuestionPapar = () => {
    const navigate = useNavigate();

    const {
        uploadPastQuestionPaper,
        loading,
        error,
        clearMessages,
    } = useQuestionBankStore();

    const { getCourses } = createCourseStore();

    const [courses, setCourses] = useState([]);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [courseError, setCourseError] = useState("");

    const [formData, setFormData] = useState({
        courseId: "",
        academicYear: "",
        semester: "",
        title: "",
        description: "",
        fileUrl: "",
        publicId: "",
    });

    // Fetch existing semester courses
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setCoursesLoading(true);
                setCourseError("");

                const response = await getCourses();

                const courseList =
                    response.courses ||
                    response.data?.courses ||
                    response.data ||
                    response ||
                    [];

                setCourses(
                    Array.isArray(courseList)
                        ? courseList.filter(
                              (course) => course.courseType === "semester"
                          )
                        : []
                );
            } catch (err) {
                setCourseError(
                    err.response?.data?.message ||
                    "Failed to load courses."
                );
            } finally {
                setCoursesLoading(false);
            }
        };

        fetchCourses();
    }, [getCourses]);

    // Get selected course
    const selectedCourse = courses.find(
        (course) => course._id === formData.courseId
    );

    // Handle form inputs
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Submit past-question paper
    const handleSubmit = async (e) => {
        e.preventDefault();

        clearMessages();

        if (!selectedCourse) {
            return;
        }

        if (selectedCourse.semester !== formData.semester) {
            return;
        }

        const result = await uploadPastQuestionPaper(formData);

        if (result.success) {
            navigate("/admin-dashboard/question-bank");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-3xl space-y-6">

                {/* Page Header */}
                <div>
                    <button
                        type="button"
                        onClick={() =>
                            navigate("/admin-dashboard/question-bank")
                        }
                        className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600"
                    >
                        <ArrowLeft size={18} />
                        Back to Question Bank
                    </button>

                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                        Upload Past Questions
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        Add a past-question paper to the StudStore Question Bank.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
                >
                    {/* Course Information */}
                    <div>
                        <h2 className="mb-4 font-semibold text-gray-900">
                            Course Information
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Select Course
                                </label>

                                <select
                                    name="courseId"
                                    value={formData.courseId}
                                    onChange={handleChange}
                                    required
                                    disabled={coursesLoading}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-gray-100"
                                >
                                    <option value="">
                                        {coursesLoading
                                            ? "Loading courses..."
                                            : "Select a semester course"}
                                    </option>

                                    {courses.map((course) => (
                                        <option
                                            key={course._id}
                                            value={course._id}
                                        >
                                            {course.courseCode} - {course.courseTitle}
                                            {course.courseScope === "department"
                                                ? ` (${course.department})`
                                                : " (Shared)"}
                                        </option>
                                    ))}
                                </select>

                                {courseError && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {courseError}
                                    </p>
                                )}

                                {!coursesLoading &&
                                    !courseError &&
                                    courses.length === 0 && (
                                        <p className="mt-2 text-sm text-amber-600">
                                            No semester courses found. Create a
                                            semester course first.
                                        </p>
                                    )}
                            </div>

                            {selectedCourse && (
                                <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                                    <p>
                                        <strong>Course:</strong>{" "}
                                        {selectedCourse.courseTitle}
                                    </p>

                                    <p>
                                        <strong>Code:</strong>{" "}
                                        {selectedCourse.courseCode}
                                    </p>

                                    <p>
                                        <strong>Course Semester:</strong>{" "}
                                        {selectedCourse.semester}
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Academic Year
                                </label>

                                <input
                                    type="text"
                                    name="academicYear"
                                    value={formData.academicYear}
                                    onChange={handleChange}
                                    placeholder="e.g. 2024/2025"
                                    maxLength={20}
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Semester
                                </label>

                                <select
                                    name="semester"
                                    value={formData.semester}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                >
                                    <option value="">Select semester</option>
                                    <option value="first">First Semester</option>
                                    <option value="second">Second Semester</option>
                                </select>

                                {selectedCourse &&
                                    formData.semester &&
                                    selectedCourse.semester !== formData.semester && (
                                        <p className="mt-2 text-sm text-red-600">
                                            This semester does not match the
                                            selected course.
                                        </p>
                                    )}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100" />

                    {/* Paper Details */}
                    <div>
                        <h2 className="mb-4 font-semibold text-gray-900">
                            Paper Details
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Paper Title
                                </label>

                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g. PHY 101 First Semester Examination"
                                    maxLength={200}
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Description (Optional)
                                </label>

                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Brief description of this past-question paper..."
                                    rows={3}
                                    maxLength={1000}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100" />

                    {/* Cloudinary PDF */}
                    <div>
                        <h2 className="mb-2 font-semibold text-gray-900">
                            PDF Document
                        </h2>

                        <p className="mb-4 text-sm text-gray-500">
                            Upload your PDF to Cloudinary first, then paste its
                            URL and public ID below.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Cloudinary PDF URL
                                </label>

                                <input
                                    type="url"
                                    name="fileUrl"
                                    value={formData.fileUrl}
                                    onChange={handleChange}
                                    placeholder="https://res.cloudinary.com/..."
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Cloudinary Public ID
                                </label>

                                <input
                                    type="text"
                                    name="publicId"
                                    value={formData.publicId}
                                    onChange={handleChange}
                                    placeholder="e.g. question-bank/phy-101-2024"
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex gap-3 rounded-lg bg-blue-50 p-4">
                            <FileText
                                size={22}
                                className="shrink-0 text-blue-600"
                            />

                            <p className="text-xs leading-5 text-blue-800">
                                The original PDF will be preserved in
                                Cloudinary. You can add its individual
                                questions after saving the paper.
                            </p>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Form Actions */}
                    <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() =>
                                navigate("/admin-dashboard/question-bank")
                            }
                            className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                loading ||
                                coursesLoading ||
                                !selectedCourse ||
                                selectedCourse.semester !== formData.semester
                            }
                            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Upload size={18} />

                            {loading ? "Saving..." : "Save Past Questions"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadPastQuestionPapar;
