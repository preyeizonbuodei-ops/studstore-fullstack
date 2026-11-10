
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Clock,
    LoaderCircle,
    Send,
    ShieldCheck,
} from "lucide-react";

const API_URL = import.meta.env.DEV
    ? "http://localhost:8000/api/v1/users"
    : "https://api.studstore.com.ng/api/v1/users";

axios.defaults.withCredentials = true;

const getId = (item) => {
    const id = item?._id || item?.id || item?.questionId || "";

    if (id && typeof id === "object") {
        return id._id || id.id || "";
    }

    return id;
};

const getQuestionText = (question) =>
    question?.questionText ||
    question?.question ||
    question?.text ||
    question?.title ||
    "Question";

const getQuestionType = (question) =>
    String(question?.questionType || question?.type || "mcq").toLowerCase();

const isWrittenQuestion = (question) => {
    const type = getQuestionType(question);

    return (
        type.includes("written") ||
        type.includes("essay") ||
        type.includes("subjective")
    );
};

// The backend scores MCQs using their numeric option index.
const getOptions = (question) => {
    const options =
        question?.options ||
        question?.choices ||
        question?.answers ||
        [];

    if (Array.isArray(options)) {
        return options.map((option, index) => ({
            value: index,
            label:
                typeof option === "object" && option !== null
                    ? String(
                          option.text ??
                              option.label ??
                              option.value ??
                              option._id ??
                              `Option ${index + 1}`
                      )
                    : String(option),
        }));
    }

    if (options && typeof options === "object") {
        return Object.entries(options).map(([key, value], index) => ({
            value: index,
            label: `${key}. ${
                typeof value === "object" && value !== null
                    ? value.text ?? value.label ?? value.value ?? ""
                    : value
            }`,
        }));
    }

    return [];
};

function StudentExamPage() {
    const { examId } = useParams();
    const navigate = useNavigate();

    const [exam, setExam] = useState(null);
    const [attempt, setAttempt] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedMode, setSelectedMode] = useState("cbt");

    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [remainingSeconds, setRemainingSeconds] = useState(null);
    const [showSubmitConfirmation, setShowSubmitConfirmation] =
        useState(false);

    const examMode = String(exam?.examMode || "cbt").toLowerCase();
    const isTimed = examMode === "cbt";

    const currentQuestion = questions[currentIndex];
    const currentQuestionId = getId(currentQuestion);

    const answeredCount = useMemo(
        () =>
            questions.filter((question) => {
                const answer = answers[getId(question)];

                return (
                    answer !== undefined &&
                    answer !== null &&
                    String(answer).trim() !== ""
                );
            }).length,
        [questions, answers]
    );

    const formatTime = (seconds) => {
        const safeSeconds = Math.max(0, seconds);
        const hours = Math.floor(safeSeconds / 3600);
        const minutes = Math.floor((safeSeconds % 3600) / 60);
        const secs = safeSeconds % 60;

        return hours > 0
            ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
            : `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    const loadExam = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await axios.get(`${API_URL}/exams`);
            const data = response.data;

            const examList = Array.isArray(data)
                ? data
                : data?.exams ||
                  data?.data?.exams ||
                  data?.data ||
                  [];

            const foundExam = examList.find(
                (item) => String(getId(item)) === String(examId)
            );

            if (!foundExam) {
                throw new Error(
                    "This exam could not be found. It may have been unpublished or may not be available to your account."
                );
            }

            setExam(foundExam);

            // Exam mode (practice/CBT) is separate from the student's
            // answering method (online CBT/handwritten).
            setSelectedMode("cbt");
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                    err?.message ||
                    "Unable to load this exam."
            );
        } finally {
            setLoading(false);
        }
    }, [examId]);

    useEffect(() => {
        loadExam();
    }, [loadExam]);

    const startAttempt = async () => {
        setStarting(true);
        setError("");
        setNotice("");

        try {
            const response = await axios.post(
                `${API_URL}/exams/${examId}/start`,
                { selectedMode }
            );

            const data = response.data;
            const newAttempt =
                data?.attempt ||
                data?.data?.attempt ||
                data?.data ||
                data;

            const attemptId = getId(newAttempt);

            if (!attemptId) {
                throw new Error(
                    "The server did not return an exam attempt ID. Check the start-exam controller response."
                );
            }

            setAttempt(newAttempt);

            const questionResponse = await axios.get(
                `${API_URL}/exam-attempts/${attemptId}/questions`
            );

            const questionData = questionResponse.data;

            const questionList = Array.isArray(questionData)
                ? questionData
                : questionData?.questions ||
                  questionData?.data?.questions ||
                  questionData?.data ||
                  [];

            if (!Array.isArray(questionList)) {
                throw new Error(
                    "The server returned an unexpected question format."
                );
            }

            setQuestions(questionList);
            setCurrentIndex(0);

            // Restore answers from the backend's savedAnswers array.
            const existingAnswers = {};
            const savedAnswers = Array.isArray(questionData?.savedAnswers)
                ? questionData.savedAnswers
                : Array.isArray(questionData?.data?.savedAnswers)
                  ? questionData.data.savedAnswers
                  : [];

            savedAnswers.forEach((saved) => {
                const questionId = getId(saved);

                if (!questionId) return;

                if (saved.selectedOptionIndex != null) {
                    existingAnswers[questionId] = saved.selectedOptionIndex;
                } else if (saved.writtenAnswer != null) {
                    existingAnswers[questionId] = saved.writtenAnswer;
                }
            });

            // Also support responses that include the answer on each question.
            questionList.forEach((question) => {
                const questionId = getId(question);

                if (!questionId || existingAnswers[questionId] !== undefined) {
                    return;
                }

                if (question.selectedOptionIndex != null) {
                    existingAnswers[questionId] =
                        question.selectedOptionIndex;
                } else if (question.writtenAnswer != null) {
                    existingAnswers[questionId] = question.writtenAnswer;
                } else if (question.savedAnswer != null) {
                    existingAnswers[questionId] = question.savedAnswer;
                } else if (question.userAnswer != null) {
                    existingAnswers[questionId] = question.userAnswer;
                }
            });

            setAnswers(existingAnswers);

            const durationMinutes =
                Number(
                    foundDuration(newAttempt, foundExamFallback(exam))
                ) || 0;

            const startTime = newAttempt?.startedAt
                ? new Date(newAttempt.startedAt).getTime()
                : Date.now();

            if (durationMinutes > 0 && isTimed) {
                const deadline = startTime + durationMinutes * 60 * 1000;

                setRemainingSeconds(
                    Math.max(
                        0,
                        Math.floor((deadline - Date.now()) / 1000)
                    )
                );
            } else {
                setRemainingSeconds(null);
            }

            if (questionList.length === 0) {
                setNotice(
                    "The attempt started, but no questions were returned."
                );
            }
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                    err?.message ||
                    "Unable to start this exam."
            );
        } finally {
            setStarting(false);
        }
    };

    const buildAnswerPayload = (questionId, answer) => {
        const question = questions.find(
            (item) => String(getId(item)) === String(questionId)
        );

        if (!question) {
            throw new Error("Could not find the question for this answer.");
        }

        if (isWrittenQuestion(question)) {
            return {
                questionId,
                writtenAnswer: String(answer ?? ""),
            };
        }

        const selectedOptionIndex = Number(answer);
        const options = getOptions(question);

        if (
            !Number.isInteger(selectedOptionIndex) ||
            selectedOptionIndex < 0 ||
            selectedOptionIndex >= options.length
        ) {
            throw new Error(
                "Please select a valid answer option before saving."
            );
        }

        return {
            questionId,
            selectedOptionIndex,
        };
    };

    const saveAnswer = async (questionId, answer) => {
        if (!attempt || !questionId) return;

        if (answer === undefined || answer === null || String(answer).trim() === "") {
            setError("Please provide an answer before saving.");
            setNotice("");
            return;
        }

        setSaving(true);
        setError("");
        setNotice("");

        try {
            const payload = buildAnswerPayload(questionId, answer);

            await axios.put(
                `${API_URL}/exam-attempts/${getId(attempt)}/answer`,
                payload
            );

            setNotice("Answer saved successfully.");
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                    err?.message ||
                    "Unable to save this answer. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const changeAnswer = (questionId, answer) => {
        setAnswers((previous) => ({
            ...previous,
            [questionId]: answer,
        }));

        setError("");
        setNotice("");
    };

    const handleSubmit = async (automatic = false) => {
        if (!attempt || submitting) return;

        setSubmitting(true);
        setError("");
        setNotice("");

        try {
            // Save every answered question before submitting. This prevents
            // scoring based on stale answers saved earlier.
            for (const question of questions) {
                const questionId = getId(question);
                const answer = answers[questionId];

                if (
                    answer === undefined ||
                    answer === null ||
                    String(answer).trim() === ""
                ) {
                    continue;
                }

                const payload = buildAnswerPayload(questionId, answer);

                await axios.put(
                    `${API_URL}/exam-attempts/${getId(attempt)}/answer`,
                    payload
                );
            }

            const response = await axios.post(
                `${API_URL}/exam-attempts/${getId(attempt)}/submit`
            );

            const result =
                response.data?.result ||
                response.data?.data?.result ||
                response.data;

            navigate(`/me/exam-results/${getId(attempt)}`, {
                replace: true,
                state: { result },
            });
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                    err?.message ||
                    (automatic
                        ? "Time expired, but the exam could not be submitted. Please try submitting again."
                        : "Unable to submit the exam. Please try again.")
            );

            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (!attempt || remainingSeconds === null || submitting) return;

        if (remainingSeconds <= 0) {
            handleSubmit(true);
            return;
        }

        const timer = window.setTimeout(() => {
            setRemainingSeconds((previous) =>
                previous === null ? null : Math.max(0, previous - 1)
            );
        }, 1000);

        return () => window.clearTimeout(timer);
    }, [attempt, remainingSeconds, submitting]);

    if (loading) {
        return (
            <main className="flex min-h-[60vh] items-center justify-center">
                <LoaderCircle
                    className="animate-spin text-blue-700"
                    size={32}
                />
                <span className="ml-3 text-slate-600">Loading exam...</span>
            </main>
        );
    }

    if (error && !exam) {
        return (
            <main className="mx-auto max-w-3xl px-4 py-10">
                <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
                    {error}
                </div>

                <button
                    onClick={() => navigate("/me/exams")}
                    className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-white"
                >
                    Back to exams
                </button>
            </main>
        );
    }

    if (!attempt) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-3xl">
                    <button
                        onClick={() => navigate("/me/exams")}
                        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700"
                    >
                        <ArrowLeft size={18} />
                        Back to exams
                    </button>

                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                            <ShieldCheck size={26} />
                        </div>

                        <h1 className="text-2xl font-bold text-slate-900">
                            {exam?.title || exam?.examTitle || "Exam"}
                        </h1>

                        {exam?.description && (
                            <p className="mt-3 leading-7 text-slate-600">
                                {exam.description}
                            </p>
                        )}

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-slate-50 p-4">
                                <p className="text-sm text-slate-500">
                                    Questions
                                </p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {exam?.totalQuestions ??
                                        exam?.questionCount ??
                                        "As available"}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-4">
                                <p className="text-sm text-slate-500">
                                    Duration
                                </p>
                                <p className="mt-1 font-semibold text-slate-900">
                                    {isTimed
                                        ? `${exam?.duration ?? exam?.durationMinutes ?? 0} minutes`
                                        : "Practice mode"}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Answering method
                            </label>

                            <select
                                value={selectedMode}
                                onChange={(event) =>
                                    setSelectedMode(event.target.value)
                                }
                                className="w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-blue-600"
                            >
                                <option value="cbt">Online CBT</option>
                                <option value="handwritten">
                                    Handwritten method
                                </option>
                            </select>

                            <p className="mt-2 text-sm text-slate-500">
                                Handwritten mode currently uses the online
                                question and answer interface.
                            </p>
                        </div>

                        {error && (
                            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                                {error}
                            </p>
                        )}

                        <button
                            onClick={startAttempt}
                            disabled={starting}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {starting ? (
                                <>
                                    <LoaderCircle
                                        size={19}
                                        className="animate-spin"
                                    />
                                    Starting exam...
                                </>
                            ) : (
                                "Start exam"
                            )}
                        </button>
                    </section>
                </div>
            </main>
        );
    }

    if (!currentQuestion) {
        return (
            <main className="mx-auto max-w-3xl px-4 py-10">
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
                    No questions are available for this attempt. Please contact
                    your administrator if this continues.
                </p>

                <button
                    onClick={() => navigate("/me/exams")}
                    className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-white"
                >
                    Back to exams
                </button>
            </main>
        );
    }

    const options = getOptions(currentQuestion);
    const isWritten = isWrittenQuestion(currentQuestion);
    const savedValue = answers[currentQuestionId] ?? "";

    return (
        <main className="min-h-screen bg-slate-50 px-3 py-5 sm:px-6 sm:py-8">
            <div className="mx-auto max-w-6xl">
                <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <button
                            onClick={() => navigate("/me/exams")}
                            className="mb-3 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-blue-700"
                        >
                            <ArrowLeft size={17} />
                            Exit exam
                        </button>

                        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                            {exam?.title || exam?.examTitle || "Exam"}
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            {exam?.courseTitle ||
                                exam?.course?.courseTitle ||
                                ""}
                        </p>
                    </div>

                    {isTimed && remainingSeconds !== null && (
                        <div
                            className={`flex items-center gap-2 rounded-xl border px-4 py-3 font-semibold ${
                                remainingSeconds <= 300
                                    ? "border-red-200 bg-red-50 text-red-700"
                                    : "border-slate-200 bg-white text-slate-800"
                            }`}
                        >
                            <Clock size={20} />
                            <span>{formatTime(remainingSeconds)}</span>
                        </div>
                    )}
                </header>

                <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-slate-700">
                            Question {currentIndex + 1} of {questions.length}
                        </span>
                        <span className="text-slate-500">
                            {answeredCount} answered
                        </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="h-full rounded-full bg-blue-700 transition-all"
                            style={{
                                width: `${
                                    ((currentIndex + 1) / questions.length) *
                                    100
                                }%`,
                            }}
                        />
                    </div>
                </div>

                <div className="grid items-start gap-5 lg:grid-cols-[1fr_280px]">
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-800">
                                Question {currentIndex + 1}
                            </span>

                            {currentQuestion?.marks != null && (
                                <span className="text-sm text-slate-500">
                                    {currentQuestion.marks} mark(s)
                                </span>
                            )}
                        </div>

                        <h2 className="whitespace-pre-wrap text-lg font-semibold leading-8 text-slate-900">
                            {getQuestionText(currentQuestion)}
                        </h2>

                        {currentQuestion?.imageUrl && (
                            <img
                                src={currentQuestion.imageUrl}
                                alt="Question illustration"
                                className="mt-5 max-h-80 max-w-full rounded-xl object-contain"
                            />
                        )}

                        {isWritten ? (
                            <div className="mt-6">
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Your answer
                                </label>

                                <textarea
                                    value={savedValue}
                                    onChange={(event) =>
                                        changeAnswer(
                                            currentQuestionId,
                                            event.target.value
                                        )
                                    }
                                    rows={8}
                                    placeholder="Write your answer here..."
                                    className="w-full rounded-xl border border-slate-300 p-4 leading-7 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        ) : options.length > 0 ? (
                            <div className="mt-6 space-y-3">
                                {options.map((option, index) => {
                                    const selected =
                                        String(savedValue) === String(index);

                                    return (
                                        <label
                                            key={`${currentQuestionId}-${index}`}
                                            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                                                selected
                                                    ? "border-blue-600 bg-blue-50"
                                                    : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name={`question-${currentQuestionId}`}
                                                value={index}
                                                checked={selected}
                                                onChange={() =>
                                                    changeAnswer(
                                                        currentQuestionId,
                                                        index
                                                    )
                                                }
                                                className="mt-1 h-4 w-4 accent-blue-700"
                                            />

                                            <span className="leading-6 text-slate-800">
                                                {option.label}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                                The question format or answer options could not
                                be identified. Check the question data returned
                                by the backend.
                            </p>
                        )}

                        {error && (
                            <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                                {error}
                            </p>
                        )}

                        {notice && (
                            <p className="mt-4 flex items-center gap-2 text-sm text-green-700">
                                <CheckCircle2 size={17} />
                                {notice}
                            </p>
                        )}

                        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                            <button
                                onClick={() =>
                                    setCurrentIndex((index) =>
                                        Math.max(0, index - 1)
                                    )
                                }
                                disabled={currentIndex === 0 || submitting}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                            >
                                <ArrowLeft size={17} />
                                Previous
                            </button>

                            <button
                                onClick={() =>
                                    saveAnswer(currentQuestionId, savedValue)
                                }
                                disabled={saving || submitting}
                                className="rounded-xl border border-blue-200 px-4 py-2.5 font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Save answer"}
                            </button>

                            {currentIndex < questions.length - 1 ? (
                                <button
                                    onClick={() =>
                                        setCurrentIndex((index) =>
                                            Math.min(
                                                questions.length - 1,
                                                index + 1
                                            )
                                        )
                                    }
                                    disabled={submitting}
                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                                >
                                    Next
                                    <ArrowRight size={17} />
                                </button>
                            ) : (
                                <button
                                    onClick={() =>
                                        setShowSubmitConfirmation(true)
                                    }
                                    disabled={submitting}
                                    className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-4 py-2.5 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                                >
                                    <Send size={17} />
                                    Submit exam
                                </button>
                            )}
                        </div>
                    </section>

                    <aside className="rounded-2xl border border-slate-200 bg-white p-5">
                        <h3 className="font-bold text-slate-900">
                            Question navigator
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                            Select a question to move to it.
                        </p>

                        <div className="mt-5 grid grid-cols-5 gap-2">
                            {questions.map((question, index) => {
                                const questionId = getId(question);
                                const answer = answers[questionId];

                                const answered =
                                    answer !== undefined &&
                                    answer !== null &&
                                    String(answer).trim() !== "";

                                const current = index === currentIndex;

                                return (
                                    <button
                                        key={questionId || index}
                                        onClick={() => setCurrentIndex(index)}
                                        aria-label={`Go to question ${index + 1}`}
                                        className={`flex aspect-square items-center justify-center rounded-lg border text-sm font-semibold ${
                                            current
                                                ? "border-blue-700 bg-blue-700 text-white"
                                                : answered
                                                  ? "border-green-200 bg-green-50 text-green-800"
                                                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                        }`}
                                    >
                                        {index + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-5 space-y-2 text-sm text-slate-600">
                            <p>
                                <span className="mr-2 inline-block h-3 w-3 rounded-sm bg-blue-700" />
                                Current question
                            </p>
                            <p>
                                <span className="mr-2 inline-block h-3 w-3 rounded-sm bg-green-200" />
                                Answer provided
                            </p>
                            <p>
                                <span className="mr-2 inline-block h-3 w-3 rounded-sm border border-slate-300 bg-white" />
                                Not answered
                            </p>
                        </div>

                        <div className="mt-6 border-t border-slate-100 pt-5">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Progress</span>
                                <span className="font-semibold text-slate-900">
                                    {answeredCount}/{questions.length}
                                </span>
                            </div>

                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-green-600"
                                    style={{
                                        width: `${
                                            questions.length
                                                ? (answeredCount /
                                                      questions.length) *
                                                  100
                                                : 0
                                        }%`,
                                    }}
                                />
                            </div>

                            <button
                                onClick={() =>
                                    setShowSubmitConfirmation(true)
                                }
                                disabled={submitting}
                                className="mt-5 w-full rounded-xl bg-green-700 px-4 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                            >
                                Submit exam
                            </button>
                        </div>
                    </aside>
                </div>
            </div>

            {showSubmitConfirmation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-slate-900">
                            Submit exam?
                        </h2>

                        <p className="mt-3 leading-6 text-slate-600">
                            You have answered {answeredCount} out of{" "}
                            {questions.length} questions.
                            {answeredCount < questions.length
                                ? " Some questions are still unanswered."
                                : " You have provided an answer to every question."}
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                            Your provided answers will be saved before the
                            exam is submitted.
                        </p>

                        {error && (
                            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                                {error}
                            </p>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() =>
                                    setShowSubmitConfirmation(false)
                                }
                                disabled={submitting}
                                className="rounded-xl border border-slate-300 px-4 py-2.5 font-medium text-slate-700"
                            >
                                Continue exam
                            </button>

                            <button
                                onClick={() => {
                                    setShowSubmitConfirmation(false);
                                    handleSubmit(false);
                                }}
                                disabled={submitting}
                                className="rounded-xl bg-green-700 px-4 py-2.5 font-semibold text-white disabled:opacity-50"
                            >
                                {submitting
                                    ? "Submitting..."
                                    : "Confirm submit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

function foundDuration(attempt, exam) {
    return (
        attempt?.duration ||
        attempt?.durationMinutes ||
        attempt?.exam?.duration ||
        exam?.duration ||
        exam?.durationMinutes ||
        0
    );
}

function foundExamFallback(exam) {
    return exam;
}

export default StudentExamPage;
