
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    BookOpen,
    FileText,
    LoaderCircle,
} from "lucide-react";
import { useStudentQuestionBankStore } from "../../../../Store/ExamSimulator/StudentQuestionBankStore";

const StudentPastQuestionPaper = () => {
    const navigate = useNavigate();
    const { paperId } = useParams();

    const {
        currentPaper,
        questions,
        loading,
        error,
        getStudentPastQuestions,
        resetQuestionBankView,
    } = useStudentQuestionBankStore();

    useEffect(() => {
        getStudentPastQuestions(paperId);

        return () => {
            resetQuestionBankView();
        };
    }, [paperId, getStudentPastQuestions, resetQuestionBankView]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <LoaderCircle className="animate-spin text-blue-600" size={35} />
                <p className="text-gray-600 mt-3">
                    Loading past questions...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-5xl mx-auto space-y-5">
                <button
                    onClick={() => navigate("/me/question-bank")}
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                >
                    <ArrowLeft size={18} />
                    Back to Question Bank
                </button>

                <div className="bg-red-50 text-red-600 rounded-xl p-5">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <button
                onClick={() => navigate("/me/question-bank")}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
            >
                <ArrowLeft size={18} />
                Back to Question Bank
            </button>

            {currentPaper && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <FileText className="text-blue-600" size={24} />
                        </div>

                        <div>
                            <h1 className="text-xl font-bold text-gray-800">
                                {currentPaper.title}
                            </h1>

                            <p className="text-sm text-gray-500">
                                {currentPaper.academicYear}
                            </p>
                        </div>
                    </div>

                    <p className="text-gray-600 text-sm">
                        {currentPaper.course?.courseCode} -{" "}
                        {currentPaper.course?.courseTitle}
                    </p>

                    <p className="text-gray-500 text-sm mt-1">
                        {currentPaper.semester === "first"
                            ? "First Semester"
                            : "Second Semester"}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-sm text-blue-600">
                        <BookOpen size={17} />
                        {questions.length} Questions
                    </div>
                </div>
            )}

            {questions.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                    <BookOpen
                        size={40}
                        className="mx-auto text-gray-400 mb-3"
                    />

                    <h2 className="font-semibold text-gray-700">
                        No questions available
                    </h2>

                    <p className="text-sm text-gray-500 mt-2">
                        There are currently no verified questions in this paper.
                    </p>
                </div>
            ) : (
                <div className="space-y-5">
                    {questions.map((question, index) => (
                        <div
                            key={question._id}
                            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sm:p-6"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                <h2 className="font-bold text-gray-800">
                                    Question {question.questionNumber || index + 1}
                                </h2>

                                <span className="text-sm text-gray-500">
                                    {question.marks}{" "}
                                    {question.marks === 1 ? "Mark" : "Marks"}
                                </span>
                            </div>

                            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                                {question.questionText}
                            </p>

                            {question.questionType === "mcq" && (
                                <div className="mt-5 space-y-3">
                                    {question.options?.map((option, optionIndex) => {
                                        const isCorrect =
                                            optionIndex === question.correctOptionIndex;

                                        return (
                                            <div
                                                key={optionIndex}
                                                className={`p-3 rounded-lg border ${
                                                    isCorrect
                                                        ? "bg-green-50 border-green-300 text-green-800"
                                                        : "bg-gray-50 border-gray-200 text-gray-700"
                                                }`}
                                            >
                                                <span className="font-semibold mr-2">
                                                    {String.fromCharCode(65 + optionIndex)}.
                                                </span>

                                                {option}

                                                {isCorrect && (
                                                    <span className="ml-2 text-xs font-semibold">
                                                        Correct Answer
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="mt-5 border-t border-gray-100 pt-4 space-y-3">
                                <div>
                                    <h3 className="text-sm font-semibold text-green-700 mb-1">
                                        Correct Answer
                                    </h3>

                                    <p className="text-gray-700 whitespace-pre-wrap">
                                        {question.questionType === "mcq"
                                            ? question.options?.[question.correctOptionIndex] ||
                                              "Answer unavailable"
                                            : question.correctAnswer || "Answer unavailable"}
                                    </p>
                                </div>

                                {question.explanation && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-blue-700 mb-1">
                                            Explanation
                                        </h3>

                                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                                            {question.explanation}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentPastQuestionPaper;
