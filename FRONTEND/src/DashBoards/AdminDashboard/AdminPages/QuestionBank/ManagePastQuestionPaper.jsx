
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    FileText,
    Plus,
    Pencil,
    Trash2,
    CheckCircle,
    ExternalLink,
    X,
} from "lucide-react";
import { useQuestionBankStore } from "../../../../Store/ExamSimulator/QuestionBankStore";

const initialForm = {
    questionNumber: "",
    questionText: "",
    questionType: "written",
    options: ["", "", "", ""],
    correctOptionIndex: "",
    correctAnswer: "",
    explanation: "",
    marks: 1,
};

const ManagePastQuestionPaper = () => {
    const { paperId } = useParams();
    const navigate = useNavigate();

    const {
        currentPaper,
        questions,
        loading,
        error,
        successMessage,
        getPastQuestionPaperById,
        getPastQuestionsByPaper,
        createPastQuestion,
        updatePastQuestion,
        verifyPastQuestion,
        deletePastQuestion,
        publishPastQuestionPaper,
        clearMessages,
    } = useQuestionBankStore();

    const [form, setForm] = useState(initialForm);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        const loadPaper = async () => {
            await getPastQuestionPaperById(paperId);
            await getPastQuestionsByPaper(paperId);
        };

        loadPaper();
    }, [paperId, getPastQuestionPaperById, getPastQuestionsByPaper]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleOptionChange = (index, value) => {
        setForm((prev) => {
            const updatedOptions = [...prev.options];
            updatedOptions[index] = value;

            return {
                ...prev,
                options: updatedOptions,
            };
        });
    };

    // Add another answer option
    const addOption = () => {
        setForm((prev) => ({
            ...prev,
            options: [...prev.options, ""],
        }));
    };

    // Remove an answer option and adjust the correct answer index
    const removeOption = (index) => {
        setForm((prev) => {
            const updatedOptions = prev.options.filter(
                (_, i) => i !== index
            );

            let updatedCorrectIndex = prev.correctOptionIndex;

            if (updatedCorrectIndex !== "") {
                const correctIndex = Number(updatedCorrectIndex);

                if (correctIndex === index) {
                    updatedCorrectIndex = "";
                } else if (correctIndex > index) {
                    updatedCorrectIndex = String(correctIndex - 1);
                }
            }

            return {
                ...prev,
                options: updatedOptions,
                correctOptionIndex: updatedCorrectIndex,
            };
        });
    };

    const resetForm = () => {
        setForm(initialForm);
        setEditingQuestion(null);
        setShowForm(false);
    };

    const handleEdit = (question) => {
        setEditingQuestion(question);

        setForm({
            questionNumber: question.questionNumber,
            questionText: question.questionText,
            questionType: question.questionType,
            options:
                question.questionType === "mcq"
                    ? [...question.options]
                    : ["", "", "", ""],
            correctOptionIndex:
                question.correctOptionIndex ?? "",
            correctAnswer: question.correctAnswer || "",
            explanation: question.explanation || "",
            marks: question.marks || 1,
        });

        setShowForm(true);
        clearMessages();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearMessages();

        const filteredOptions =
            form.questionType === "mcq"
                ? form.options.map((option) => option.trim())
                : [];

        if (
            form.questionType === "mcq" &&
            (filteredOptions.length < 2 ||
                filteredOptions.some((option) => !option))
        ) {
            alert("Please provide at least two complete answer options.");
            return;
        }

        if (
            form.questionType === "mcq" &&
            (form.correctOptionIndex === "" ||
                Number(form.correctOptionIndex) >= filteredOptions.length)
        ) {
            alert("Please select the correct answer option.");
            return;
        }

        const questionData = {
            questionNumber: Number(form.questionNumber),
            questionText: form.questionText.trim(),
            questionType: form.questionType,
            marks: Number(form.marks),
            explanation: form.explanation.trim(),
            options: filteredOptions,
            correctOptionIndex:
                form.questionType === "mcq"
                    ? Number(form.correctOptionIndex)
                    : null,
            correctAnswer:
                form.questionType === "written"
                    ? form.correctAnswer.trim()
                    : "",
        };

        const result = editingQuestion
            ? await updatePastQuestion(
                  paperId,
                  editingQuestion._id,
                  questionData
              )
            : await createPastQuestion(paperId, questionData);

        if (result.success) {
            resetForm();
        }
    };

    const handleVerify = async (questionId) => {
        const confirmed = window.confirm(
            "Verify this question? Make sure its correct answer is accurate."
        );

        if (!confirmed) return;

        await verifyPastQuestion(paperId, questionId);
    };

    const handleDelete = async (questionId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this question?"
        );

        if (!confirmed) return;

        await deletePastQuestion(paperId, questionId);
    };

    const handlePublish = async () => {
        const confirmed = window.confirm(
            "Publish this past-question paper? Students will be able to access it."
        );

        if (!confirmed) return;

        const result = await publishPastQuestionPaper(paperId);

        if (result.success) {
            await getPastQuestionPaperById(paperId);
            await getPastQuestionsByPaper(paperId);
        }
    };

    const course = currentPaper?.courseId;

    if (loading && !currentPaper) {
        return (
            <div className="p-6 text-center text-gray-500">
                Loading past-question paper...
            </div>
        );
    }

    if (!currentPaper) {
        return (
            <div className="p-6">
                <p className="text-red-500">
                    {error || "Past-question paper could not be loaded."}
                </p>

                <button
                    onClick={() => navigate("/admin-dashboard/question-bank")}
                    className="mt-4 text-blue-600"
                >
                    Back to Question Bank
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            <button
                onClick={() => navigate("/admin-dashboard/question-bank")}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
            >
                <ArrowLeft size={18} />
                Back to Question Bank
            </button>

            {/* Paper information */}
            <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                            {currentPaper.title}
                        </h1>

                        <p className="text-gray-500 mt-1">
                            {course?.courseCode} - {course?.courseTitle}
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                            {currentPaper.academicYear} Academic Year ·{" "}
                            {currentPaper.semester} Semester
                        </p>
                    </div>

                    <span
                        className={`px-3 py-1 rounded-full text-sm font-medium capitalize w-fit ${
                            currentPaper.status === "published"
                                ? "bg-green-100 text-green-700"
                                : currentPaper.status === "archived"
                                ? "bg-gray-100 text-gray-600"
                                : "bg-yellow-100 text-yellow-700"
                        }`}
                    >
                        {currentPaper.status}
                    </span>
                </div>

                {currentPaper.description && (
                    <p className="text-gray-600 text-sm">
                        {currentPaper.description}
                    </p>
                )}

                <a
                    href={currentPaper.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                >
                    <FileText size={18} />
                    View Original PDF
                    <ExternalLink size={15} />
                </a>
            </div>

            {/* Messages */}
            {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="bg-green-50 text-green-700 p-3 rounded-lg">
                    {successMessage}
                </div>
            )}

            {/* Questions heading */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">
                        Questions
                    </h2>
                    <p className="text-sm text-gray-500">
                        {questions.length} question(s) added
                    </p>
                </div>

                {currentPaper.status === "draft" && (
                    <button
                        onClick={() => {
                            resetForm();
                            setShowForm(true);
                            clearMessages();
                        }}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                        <Plus size={18} />
                        Add Question
                    </button>
                )}
            </div>

            {/* Add/Edit question form */}
            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="bg-white border rounded-xl shadow-sm p-5 space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800">
                            {editingQuestion ? "Edit Question" : "Add Question"}
                        </h3>

                        <button type="button" onClick={resetForm}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Question Number
                            </label>
                            <input
                                type="number"
                                name="questionNumber"
                                min="1"
                                required
                                value={form.questionNumber}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Question Type
                            </label>
                            <select
                                name="questionType"
                                value={form.questionType}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-2"
                            >
                                <option value="written">Written</option>
                                <option value="mcq">Multiple Choice</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Marks
                            </label>
                            <input
                                type="number"
                                name="marks"
                                min="1"
                                required
                                value={form.marks}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-2"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Question Text
                        </label>
                        <textarea
                            name="questionText"
                            rows="4"
                            required
                            value={form.questionText}
                            onChange={handleChange}
                            className="w-full border rounded-lg p-3"
                            placeholder="Enter the question..."
                        />
                    </div>

                    {/* Dynamic MCQ Options */}
                    {form.questionType === "mcq" && (
                        <div className="space-y-3">
                            <label className="block text-sm font-medium">
                                Answer Options
                            </label>

                            {form.options.map((option, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-2"
                                >
                                    <input
                                        type="text"
                                        value={option}
                                        required
                                        onChange={(e) =>
                                            handleOptionChange(
                                                index,
                                                e.target.value
                                            )
                                        }
                                        placeholder={`Option ${String.fromCharCode(
                                            65 + index
                                        )}`}
                                        className="w-full border rounded-lg p-2"
                                    />

                                    {form.options.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => removeOption(index)}
                                            className="text-red-500 hover:text-red-700"
                                            title="Remove option"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={addOption}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                            >
                                <Plus size={17} />
                                Add Another Option
                            </button>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Correct Option
                                </label>

                                <select
                                    name="correctOptionIndex"
                                    required
                                    value={form.correctOptionIndex}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg p-2"
                                >
                                    <option value="">
                                        Select correct option
                                    </option>

                                    {form.options.map((option, index) => (
                                        option.trim() && (
                                            <option key={index} value={index}>
                                                Option {String.fromCharCode(
                                                    65 + index
                                                )}
                                            </option>
                                        )
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {form.questionType === "written" && (
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Correct Answer / Model Answer
                            </label>
                            <textarea
                                name="correctAnswer"
                                rows="4"
                                required
                                value={form.correctAnswer}
                                onChange={handleChange}
                                className="w-full border rounded-lg p-3"
                                placeholder="Enter the model answer..."
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Explanation (Optional)
                        </label>
                        <textarea
                            name="explanation"
                            rows="3"
                            value={form.explanation}
                            onChange={handleChange}
                            className="w-full border rounded-lg p-3"
                            placeholder="Add an explanation..."
                        />
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg"
                        >
                            {loading
                                ? "Saving..."
                                : editingQuestion
                                ? "Update Question"
                                : "Save Question"}
                        </button>

                        <button
                            type="button"
                            onClick={resetForm}
                            className="border px-5 py-2 rounded-lg"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Questions list */}
            <div className="space-y-4">
                {questions.length === 0 ? (
                    <div className="bg-white border rounded-xl p-8 text-center text-gray-500">
                        No questions have been added to this paper yet.
                    </div>
                ) : (
                    questions.map((question) => (
                        <div
                            key={question._id}
                            className="bg-white border rounded-xl p-5 space-y-3"
                        >
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold text-gray-800">
                                        Question {question.questionNumber}
                                    </span>

                                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded capitalize">
                                        {question.questionType}
                                    </span>

                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                        {question.marks} mark(s)
                                    </span>

                                    <span
                                        className={`text-xs px-2 py-1 rounded ${
                                            question.isVerified
                                                ? "bg-green-100 text-green-700"
                                                : "bg-yellow-100 text-yellow-700"
                                        }`}
                                    >
                                        {question.isVerified
                                            ? "Verified"
                                            : "Not verified"}
                                    </span>
                                </div>

                                {currentPaper.status === "draft" && (
                                    <div className="flex flex-wrap items-center gap-3">
                                        <button
                                            onClick={() => handleEdit(question)}
                                            className="text-blue-600 hover:text-blue-800"
                                            title="Edit question"
                                        >
                                            <Pencil size={18} />
                                        </button>

                                        {!question.isVerified && (
                                            <button
                                                onClick={() =>
                                                    handleVerify(question._id)
                                                }
                                                className="text-green-600 hover:text-green-800"
                                                title="Verify question"
                                            >
                                                <CheckCircle size={19} />
                                            </button>
                                        )}

                                        <button
                                            onClick={() =>
                                                handleDelete(question._id)
                                            }
                                            className="text-red-600 hover:text-red-800"
                                            title="Delete question"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <p className="text-gray-800 whitespace-pre-wrap">
                                {question.questionText}
                            </p>

                            {question.questionType === "mcq" && (
                                <div className="space-y-2 pl-3">
                                    {question.options?.map((option, index) => (
                                        <p
                                            key={index}
                                            className={`text-sm ${
                                                question.isVerified &&
                                                index === question.correctOptionIndex
                                                    ? "text-green-700 font-semibold"
                                                    : "text-gray-600"
                                            }`}
                                        >
                                            {String.fromCharCode(65 + index)}.{" "}
                                            {option}
                                            {question.isVerified &&
                                                index === question.correctOptionIndex &&
                                                " (Correct answer)"}
                                        </p>
                                    ))}
                                </div>
                            )}

                            {question.questionType === "written" &&
                                question.isVerified && (
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs font-semibold text-gray-500 mb-1">
                                            VERIFIED MODEL ANSWER
                                        </p>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {question.correctAnswer}
                                        </p>
                                    </div>
                                )}

                            {question.explanation && (
                                <p className="text-sm text-gray-500">
                                    Explanation: {question.explanation}
                                </p>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Publish paper */}
            {currentPaper.status === "draft" && questions.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border rounded-xl p-5">
                    <div>
                        <h3 className="font-semibold text-gray-800">
                            Publish Past-Question Paper
                        </h3>
                        <p className="text-sm text-gray-500">
                            All questions must be verified before publishing.
                        </p>
                    </div>

                    <button
                        onClick={handlePublish}
                        disabled={
                            loading ||
                            questions.some((question) => !question.isVerified)
                        }
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white px-5 py-2 rounded-lg"
                    >
                        Publish Paper
                    </button>
                </div>
            )}
        </div>
    );
};

export default ManagePastQuestionPaper;
