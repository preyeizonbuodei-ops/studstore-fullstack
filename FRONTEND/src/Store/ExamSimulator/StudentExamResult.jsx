
import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import {
    ArrowLeft,
    LoaderCircle,
    CheckCircle2,
    Clock,
} from "lucide-react";

const API_URL = import.meta.env.DEV
    ? "http://localhost:8000/api/v1/users"
    : "https://api.studstore.com.ng/api/v1/users";

axios.defaults.withCredentials = true;

export default function StudentExamResult() {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [result, setResult] = useState(location.state?.result || null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadResult() {
            try {
                setLoading(true);
                setError("");

                const response = await axios.get(
                    `${API_URL}/exam-attempts/${attemptId}/result`
                );

                if (!cancelled) {
                    setResult(response.data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                            "Unable to load your exam result."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadResult();

        return () => {
            cancelled = true;
        };
    }, [attemptId]);

    const getOptionText = (option) => {
        if (option == null) return "";

        if (typeof option === "object") {
            return String(
                option.text ??
                option.label ??
                option.value ??
                ""
            );
        }

        return String(option);
    };

    const getCorrectAnswer = (item) => {
        if (
            item.correctAnswer != null &&
            typeof item.correctAnswer === "string" &&
            item.correctAnswer.trim() !== ""
        ) {
            return item.correctAnswer;
        }

        if (
            item.correctAnswer != null &&
            typeof item.correctAnswer === "number"
        ) {
            return String(item.correctAnswer);
        }

        if (
            item.correctAnswer &&
            typeof item.correctAnswer === "object"
        ) {
            return getOptionText(item.correctAnswer);
        }

        const options = Array.isArray(item.options)
            ? item.options
            : [];

        if (
            Number.isInteger(item.correctOptionIndex) &&
            item.correctOptionIndex >= 0 &&
            item.correctOptionIndex < options.length
        ) {
            return getOptionText(
                options[item.correctOptionIndex]
            );
        }

        return "";
    };

    const getStudentAnswer = (item) => {
        const options = Array.isArray(item.options)
            ? item.options
            : [];

        if (Number.isInteger(item.selectedOptionIndex)) {
            return getOptionText(
                options[item.selectedOptionIndex]
            ) || "Answer selected";
        }

        if (
            item.writtenAnswer != null &&
            String(item.writtenAnswer).trim() !== ""
        ) {
            return String(item.writtenAnswer);
        }

        return "No answer provided";
    };

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center gap-3">
                <LoaderCircle
                    className="animate-spin text-blue-700"
                    size={28}
                />
                <p>Loading your result...</p>
            </main>
        );
    }

    const released = result?.resultsReleased === true;
    const details = result?.result || result;
    const score = details?.score;
    const percentage = details?.percentage;
    const exam = result?.exam;
    const corrections = Array.isArray(result?.corrections)
        ? result.corrections
        : [];

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10">
            <div className="mx-auto max-w-3xl">
                <button
                    onClick={() => navigate("/me/exam-history")}
                    className="mb-6 inline-flex items-center gap-2 text-slate-600 hover:text-blue-700"
                >
                    <ArrowLeft size={18} />
                    Exam history
                </button>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    {error ? (
                        <>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Unable to load result
                            </h1>

                            <p className="mt-3 text-red-700">
                                {error}
                            </p>

                            <button
                                onClick={() => window.location.reload()}
                                className="mt-5 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white"
                            >
                                Try again
                            </button>
                        </>
                    ) : !released ? (
                        <>
                            <Clock
                                size={38}
                                className="text-amber-600"
                            />

                            <h1 className="mt-4 text-2xl font-bold text-slate-900">
                                Result pending
                            </h1>

                            <p className="mt-3 leading-7 text-slate-600">
                                Your exam has been submitted. Your result
                                will be available after any required
                                written answers have been marked.
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-3">
                                <CheckCircle2
                                    size={34}
                                    className="text-green-600"
                                />

                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900">
                                        Exam result
                                    </h1>

                                    <p className="text-sm text-slate-500">
                                        {exam?.title || "Your submitted exam"}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div className="rounded-xl bg-blue-50 p-5">
                                    <p className="text-sm text-slate-600">
                                        Score
                                    </p>

                                    <p className="mt-2 text-3xl font-bold text-blue-800">
                                        {score ?? "—"}
                                        {details?.totalMarks != null &&
                                            ` / ${details.totalMarks}`}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-green-50 p-5">
                                    <p className="text-sm text-slate-600">
                                        Percentage
                                    </p>

                                    <p className="mt-2 text-3xl font-bold text-green-800">
                                        {percentage != null
                                            ? `${percentage}%`
                                            : "—"}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-slate-100 p-5">
                                    <p className="text-sm text-slate-600">
                                        Status
                                    </p>

                                    <p className="mt-2 text-xl font-bold capitalize text-slate-800">
                                        {details?.status || "Submitted"}
                                    </p>
                                </div>
                            </div>

                            <p className="mt-6 text-sm text-slate-500">
                                {details?.submittedAt
                                    ? `Submitted: ${new Date(
                                          details.submittedAt
                                      ).toLocaleString()}`
                                    : "Your submission has been recorded."}
                            </p>

                            {corrections.length > 0 && (
                                <div className="mt-8">
                                    <h2 className="text-xl font-bold text-slate-900">
                                        Corrections
                                    </h2>

                                    <div className="mt-4 space-y-4">
                                        {corrections.map((item, index) => {
                                            const correctAnswer =
                                                getCorrectAnswer(item);

                                            const studentAnswer =
                                                getStudentAnswer(item);

                                            return (
                                                <article
                                                    key={
                                                        item.questionId ||
                                                        index
                                                    }
                                                    className="rounded-xl border border-slate-200 p-4"
                                                >
                                                    <p className="font-semibold text-slate-900">
                                                        {item.questionText ||
                                                            `Question ${index + 1}`}
                                                    </p>

                                                    <p className="mt-3 text-sm text-slate-600">
                                                        Your answer:{" "}
                                                        <span className="font-medium text-slate-900">
                                                            {studentAnswer}
                                                        </span>
                                                    </p>

                                                    <p className="mt-2 text-sm text-green-700">
                                                        Correct answer:{" "}
                                                        <span className="font-semibold">
                                                            {correctAnswer ||
                                                                "Correct answer not available"}
                                                        </span>
                                                    </p>

                                                    {item.awardedMarks != null && (
                                                        <p className="mt-2 text-sm text-slate-600">
                                                            Marks awarded:{" "}
                                                            {item.awardedMarks}
                                                            {item.marks != null &&
                                                                ` / ${item.marks}`}
                                                        </p>
                                                    )}

                                                    {item.explanation && (
                                                        <p className="mt-3 text-sm leading-6 text-slate-700">
                                                            Explanation:{" "}
                                                            {item.explanation}
                                                        </p>
                                                    )}

                                                    {item.feedback && (
                                                        <p className="mt-2 text-sm text-slate-600">
                                                            Feedback:{" "}
                                                            {item.feedback}
                                                        </p>
                                                    )}
                                                </article>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-6">
                        <button
                            onClick={() => navigate("/me/exam-history")}
                            className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
                        >
                            View exam history
                        </button>

                        <button
                            onClick={() => navigate("/me/exams")}
                            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Back to exams
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
}
