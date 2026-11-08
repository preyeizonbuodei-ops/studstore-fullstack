
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  RefreshCw,
  ClipboardList,
  AlertCircle,
  CheckCircle,
  BookOpen,
  Download,
} from "lucide-react";
import { useAdminExamStore } from "./AdminExamStore";
import { useQuestionBankStore } from "./QuestionBankStore";

const emptyQuestion = {
  questionText: "",
  questionType: "mcq",
  options: ["", "", "", ""],
  correctOptionIndex: 0,
  correctAnswer: "",
  explanation: "",
  marks: 1,
};

export default function AdminExamQuestions() {
  const navigate = useNavigate();
  const { examId } = useParams();

  const {
    currentExam,
    questions,
    loading,
    error,
    successMessage,
    getExamById,
    getQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
  } = useAdminExamStore();

  const {
    getPastQuestionPapers,
    getPastQuestionsByPaper,
    addQuestionsToExam,
  } = useQuestionBankStore();

  const [form, setForm] = useState(emptyQuestion);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [localError, setLocalError] = useState("");
  const [localSuccess, setLocalSuccess] = useState("");

  // Question Bank states
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankPapers, setBankPapers] = useState([]);
  const [bankQuestions, setBankQuestions] = useState([]);
  const [selectedPaperId, setSelectedPaperId] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [bankError, setBankError] = useState("");

  useEffect(() => {
    if (examId) {
      getExamById(examId);
      getQuestions(examId);
    }
  }, [examId, getExamById, getQuestions]);

  const courseId =
    typeof currentExam?.courseId === "object"
      ? currentExam?.courseId?._id
      : currentExam?.courseId;

  const questionList = Array.isArray(questions) ? questions : [];

  const importedQuestionIds = new Set(
    questionList
      .map((question) => question.questionBankQuestionId)
      .filter(Boolean)
      .map((id) => String(id))
  );

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const updateOption = (index, value) => {
    setForm((previous) => ({
      ...previous,
      options: previous.options.map((option, optionIndex) =>
        optionIndex === index ? value : option
      ),
    }));
  };

  const resetForm = () => {
    setForm(emptyQuestion);
    setEditingId(null);
    setShowForm(false);
    setLocalError("");
  };

  const handleEdit = (question) => {
    setForm({
      questionText: question.questionText || "",
      questionType: question.questionType || "mcq",
      options:
        question.options?.length === 4
          ? [...question.options]
          : question.options?.length
            ? [...question.options]
            : ["", "", "", ""],
      correctOptionIndex: question.correctOptionIndex ?? 0,
      correctAnswer: question.correctAnswer || "",
      explanation: question.explanation || "",
      marks: question.marks ?? 1,
    });

    setEditingId(question._id);
    setShowForm(true);
    setLocalError("");
  };

  // Load published papers belonging to this exam's course.
  const handleOpenBank = async () => {
    if (!courseId) {
      setLocalError("The exam course information is not available yet.");
      return;
    }

    setShowBankModal(true);
    setBankLoading(true);
    setBankError("");
    setLocalError("");
    setSelectedPaperId("");
    setBankQuestions([]);
    setSelectedQuestionIds([]);

    try {
      const result = await getPastQuestionPapers({
        courseId,
        status: "published",
      });

      if (!result?.success) {
        throw new Error(result?.message || "Unable to load past-question papers.");
      }

      const papers = Array.isArray(result.data) ? result.data : [];

      // Keep only published papers belonging to this exam's course.
      const matchingPapers = papers.filter((paper) => {
        const paperCourseId =
          typeof paper.courseId === "object"
            ? paper.courseId?._id
            : paper.courseId;

        return (
          paper.status === "published" &&
          String(paperCourseId) === String(courseId)
        );
      });

      setBankPapers(matchingPapers);

      if (matchingPapers.length === 0) {
        setBankError(
          "There are no published past-question papers for this course yet."
        );
      }
    } catch (err) {
      setBankError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load Question Bank."
      );
    } finally {
      setBankLoading(false);
    }
  };

  // Load verified questions from the selected paper.
  const handleSelectPaper = async (paperId) => {
    setSelectedPaperId(paperId);
    setBankQuestions([]);
    setSelectedQuestionIds([]);
    setBankError("");

    if (!paperId) return;

    setBankLoading(true);

    try {
      const result = await getPastQuestionsByPaper(paperId);

      if (!result?.success) {
        throw new Error(result?.message || "Unable to load questions.");
      }

      const paperQuestions = Array.isArray(result.data) ? result.data : [];

      // Only verified questions can be imported.
      setBankQuestions(
        paperQuestions.filter(
          (question) => question.isVerified === true
        )
      );

      if (!paperQuestions.some((question) => question.isVerified === true)) {
        setBankError(
          "This paper has no verified questions available for import."
        );
      }
    } catch (err) {
      setBankError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load questions from this paper."
      );
    } finally {
      setBankLoading(false);
    }
  };

  const toggleBankQuestion = (questionId) => {
    setSelectedQuestionIds((previous) =>
      previous.includes(questionId)
        ? previous.filter((id) => id !== questionId)
        : [...previous, questionId]
    );
  };

  // Import selected questions into the current exam.
  const handleImportQuestions = async () => {
    if (selectedQuestionIds.length === 0) {
      setBankError("Select at least one question to import.");
      return;
    }

    setImporting(true);
    setBankError("");
    setLocalError("");
    setLocalSuccess("");

    try {
      const result = await addQuestionsToExam(
        examId,
        selectedQuestionIds
      );

      if (!result?.success) {
        throw new Error(result?.message || "Unable to import questions.");
      }

      await getQuestions(examId);

      setShowBankModal(false);
      setSelectedQuestionIds([]);
      setSelectedPaperId("");
      setBankQuestions([]);

      setLocalSuccess(
        `${selectedQuestionIds.length} question(s) imported successfully.`
      );
    } catch (err) {
      setBankError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to import selected questions."
      );
    } finally {
      setImporting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError("");

    if (!form.questionText.trim()) {
      setLocalError("Enter the question text.");
      return;
    }

    if (!Number.isFinite(Number(form.marks)) || Number(form.marks) <= 0) {
      setLocalError("Marks must be greater than zero.");
      return;
    }

    if (form.questionType === "mcq") {
      if (
        form.options.length < 2 ||
        form.options.some((option) => !option.trim())
      ) {
        setLocalError("Complete every option before saving.");
        return;
      }

      if (
        form.correctOptionIndex < 0 ||
        form.correctOptionIndex >= form.options.length
      ) {
        setLocalError("Select the correct answer.");
        return;
      }
    } else if (!form.correctAnswer.trim()) {
      setLocalError("Enter the model answer for this written question.");
      return;
    }

    const payload = {
      questionText: form.questionText.trim(),
      questionType: form.questionType,
      options:
        form.questionType === "mcq"
          ? form.options.map((option) => option.trim())
          : [],
      correctOptionIndex:
        form.questionType === "mcq" ? Number(form.correctOptionIndex) : null,
      correctAnswer:
        form.questionType === "written" ? form.correctAnswer.trim() : "",
      explanation: form.explanation.trim(),
      marks: Number(form.marks),
    };

    try {
      const result = editingId
        ? await updateQuestion(examId, editingId, payload)
        : await createQuestion(examId, payload);

      if (result === false) return;

      await getQuestions(examId);
      resetForm();
    } catch (err) {
      setLocalError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save the question."
      );
    }
  };

  const handleDelete = async (questionId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this question?"
    );

    if (!confirmed) return;

    setLocalError("");

    try {
      await deleteQuestion(examId, questionId);
      await getQuestions(examId);
    } catch (err) {
      setLocalError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to delete the question."
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => navigate("/admin-dashboard/exam-management")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700"
        >
          <ArrowLeft size={18} />
          Back to Exam Management
        </button>

        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-blue-700">
              <ClipboardList size={22} />
              <span className="text-sm font-semibold">Exam Questions</span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {currentExam?.title || "Manage Questions"}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Create questions manually or import verified past questions from
              your Question Bank.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => getQuestions(examId)}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              <RefreshCw size={17} />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleOpenBank}
              disabled={!courseId}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            >
              <BookOpen size={18} />
              Add from Question Bank
            </button>

            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              Add Question
            </button>
          </div>
        </div>

        {(localError || error) && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{localError || error}</span>
          </div>
        )}

        {localSuccess && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <CheckCircle size={18} className="mt-0.5 shrink-0" />
            <span>{localSuccess}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <CheckCircle size={18} className="mt-0.5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Question Bank Import Modal */}
        {showBankModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6">
            <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 p-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Import from Question Bank
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Select a published paper and choose the questions to add.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close Question Bank"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto p-5">
                {bankError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span>{bankError}</span>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Select Past-Question Paper
                  </label>

                  <select
                    value={selectedPaperId}
                    onChange={(event) => handleSelectPaper(event.target.value)}
                    disabled={bankLoading || bankPapers.length === 0}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 outline-none focus:border-blue-500 disabled:bg-slate-100"
                  >
                    <option value="">Choose a published paper</option>

                    {bankPapers.map((paper) => (
                      <option key={paper._id} value={paper._id}>
                        {paper.title} — {paper.academicYear} (
                        {paper.semester} semester)
                      </option>
                    ))}
                  </select>
                </div>

                {bankLoading && (
                  <div className="py-8 text-center text-sm text-slate-500">
                    Loading Question Bank...
                  </div>
                )}

                {!bankLoading && selectedPaperId && bankQuestions.length > 0 && (
                  <div>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-bold text-slate-900">
                        Available Questions ({bankQuestions.length})
                      </h3>

                      <span className="text-sm text-blue-700">
                        {selectedQuestionIds.length} selected
                      </span>
                    </div>

                    <div className="space-y-3">
                      {bankQuestions.map((question, index) => {
                        const alreadyImported = importedQuestionIds.has(
                          String(question._id)
                        );

                        const isSelected = selectedQuestionIds.includes(
                          question._id
                        );

                        return (
                          <label
                            key={question._id}
                            className={`block rounded-lg border p-4 ${
                              alreadyImported
                                ? "border-slate-200 bg-slate-100 opacity-60"
                                : isSelected
                                  ? "border-blue-400 bg-blue-50"
                                  : "border-slate-200 hover:border-blue-300"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={alreadyImported}
                                onChange={() =>
                                  toggleBankQuestion(question._id)
                                }
                                className="mt-1 h-4 w-4 accent-blue-600"
                              />

                              <div className="min-w-0 flex-1">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-semibold text-slate-500">
                                    Question {question.questionNumber || index + 1}
                                  </span>

                                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                                    {question.questionType === "mcq"
                                      ? "Multiple Choice"
                                      : "Written"}
                                  </span>

                                  <span className="text-xs text-slate-500">
                                    {question.marks} mark(s)
                                  </span>

                                  {alreadyImported && (
                                    <span className="text-xs font-semibold text-green-700">
                                      Already added
                                    </span>
                                  )}
                                </div>

                                <p className="whitespace-pre-wrap text-sm font-medium text-slate-800">
                                  {question.questionText}
                                </p>

                                {question.questionType === "mcq" &&
                                  question.options?.length > 0 && (
                                    <div className="mt-3 space-y-1">
                                      {question.options.map((option, optionIndex) => (
                                        <p
                                          key={optionIndex}
                                          className="text-sm text-slate-600"
                                        >
                                          {String.fromCharCode(65 + optionIndex)}.{" "}
                                          {option}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!bankLoading &&
                  selectedPaperId &&
                  bankQuestions.length === 0 &&
                  !bankError && (
                    <p className="py-6 text-center text-sm text-slate-500">
                      No verified questions are available in this paper.
                    </p>
                  )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-5">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleImportQuestions}
                  disabled={importing || selectedQuestionIds.length === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download size={17} />
                  {importing
                    ? "Importing..."
                    : `Import ${selectedQuestionIds.length} Question(s)`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manual Question Form */}
        {showForm && (
          <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? "Edit Question" : "Create Question"}
              </h2>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close question form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Question
                </label>
                <textarea
                  value={form.questionText}
                  onChange={(event) =>
                    updateField("questionText", event.target.value)
                  }
                  rows={3}
                  required
                  placeholder="Enter the question..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Question Type
                  </label>
                  <select
                    value={form.questionType}
                    onChange={(event) => {
                      updateField("questionType", event.target.value);
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 outline-none focus:border-blue-500"
                  >
                    <option value="mcq">Multiple Choice (MCQ)</option>
                    <option value="written">Written Answer</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Marks
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.marks}
                    onChange={(event) =>
                      updateField("marks", event.target.value)
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {form.questionType === "mcq" ? (
                <div>
                  <label className="mb-3 block text-sm font-semibold text-slate-700">
                    Answer Options
                  </label>

                  <div className="space-y-3">
                    {form.options.map((option, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3"
                      >
                        <input
                          type="radio"
                          name="correctOption"
                          checked={Number(form.correctOptionIndex) === index}
                          onChange={() =>
                            updateField("correctOptionIndex", index)
                          }
                          aria-label={`Mark option ${index + 1} as correct`}
                          className="h-4 w-4 accent-blue-600"
                        />

                        <span className="w-6 text-sm font-semibold text-slate-500">
                          {String.fromCharCode(65 + index)}.
                        </span>

                        <input
                          value={option}
                          onChange={(event) =>
                            updateOption(index, event.target.value)
                          }
                          required
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
                        />

                        {form.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() =>
                              setForm((previous) => ({
                                ...previous,
                                options: previous.options.filter(
                                  (_, optionIndex) => optionIndex !== index
                                ),
                                correctOptionIndex:
                                  Number(previous.correctOptionIndex) === index
                                    ? 0
                                    : Number(previous.correctOptionIndex) > index
                                      ? Number(previous.correctOptionIndex) - 1
                                      : previous.correctOptionIndex,
                              }))
                            }
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            aria-label={`Remove option ${index + 1}`}
                          >
                            <X size={17} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setForm((previous) => ({
                        ...previous,
                        options: [...previous.options, ""],
                      }))
                    }
                    className="mt-3 text-sm font-semibold text-blue-700 hover:text-blue-900"
                  >
                    + Add another option
                  </button>

                  <p className="mt-2 text-xs text-slate-500">
                    Select the radio button beside the correct answer.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Model Answer
                  </label>
                  <textarea
                    value={form.correctAnswer}
                    onChange={(event) =>
                      updateField("correctAnswer", event.target.value)
                    }
                    rows={4}
                    required
                    placeholder="Enter the expected answer..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Explanation (optional)
                </label>
                <textarea
                  value={form.explanation}
                  onChange={(event) =>
                    updateField("explanation", event.target.value)
                  }
                  rows={3}
                  placeholder="Explain why the answer is correct..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save size={18} />
                  {loading
                    ? "Saving..."
                    : editingId
                      ? "Update Question"
                      : "Save Question"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Exam Questions */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-bold text-slate-900">
              Questions ({questionList.length})
            </h2>
          </div>

          {loading && questionList.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              Loading questions...
            </div>
          ) : questionList.length === 0 ? (
            <div className="p-10 text-center">
              <ClipboardList
                size={42}
                className="mx-auto mb-3 text-slate-300"
              />
              <h3 className="font-semibold text-slate-800">
                No questions yet
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Add a manual question or import questions from your Question Bank.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Add First Question
                </button>
                <button
                  type="button"
                  onClick={handleOpenBank}
                  disabled={!courseId}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                >
                  Import from Question Bank
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {questionList.map((question, index) => (
                <article key={question._id} className="p-5 sm:p-6">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          Question {index + 1}
                        </span>

                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {question.questionType === "mcq"
                            ? "Multiple Choice"
                            : "Written"}
                        </span>

                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                          {question.marks} mark(s)
                        </span>

                        {question.questionSource === "past_question" && (
                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                            Past Question
                          </span>
                        )}

                        {question.questionSource === "ai" && (
                          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                            AI Generated
                          </span>
                        )}

                        {question.reviewStatus && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                            Review: {question.reviewStatus}
                          </span>
                        )}
                      </div>

                      <p className="whitespace-pre-wrap font-medium text-slate-900">
                        {question.questionText}
                      </p>

                      {question.questionType === "mcq" &&
                        question.options?.length > 0 && (
                          <div className="mt-4 space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <div
                                key={optionIndex}
                                className={`rounded-lg border px-3 py-2 text-sm ${
                                  optionIndex === question.correctOptionIndex
                                    ? "border-green-300 bg-green-50 text-green-800"
                                    : "border-slate-200 text-slate-600"
                                }`}
                              >
                                {String.fromCharCode(65 + optionIndex)}.{" "}
                                {option}
                                {optionIndex === question.correctOptionIndex &&
                                  " (Correct answer)"}
                              </div>
                            ))}
                          </div>
                        )}

                      {question.questionType === "written" &&
                        question.correctAnswer && (
                          <div className="mt-4 rounded-lg bg-slate-50 p-3">
                            <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                              Model Answer
                            </p>
                            <p className="whitespace-pre-wrap text-sm text-slate-700">
                              {question.correctAnswer}
                            </p>
                          </div>
                        )}

                      {question.explanation && (
                        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-500">
                          Explanation: {question.explanation}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-2 sm:self-start">
                      <button
                        type="button"
                        onClick={() => handleEdit(question)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Edit size={16} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(question._id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
