
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, ArrowRight, BookOpen } from "lucide-react";
import { useStudentQuestionBankStore } from "../../../../Store/ExamSimulator/StudentQuestionBankStore";

const StudentQuestionBank = () => {
    const navigate = useNavigate();

    const {
        papers,
        loading,
        error,
        getStudentPastQuestionPapers,
    } = useStudentQuestionBankStore();

    useEffect(() => {
        getStudentPastQuestionPapers();
    }, [getStudentPastQuestionPapers]);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">
                    Past Questions Library
                </h1>

                <p className="text-gray-600 mt-2">
                    Browse verified past examination questions, answers and explanations.
                </p>
            </div>

            {loading && (
                <p className="text-gray-600">
                    Loading past-question papers...
                </p>
            )}

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                    {error}
                </div>
            )}

            {!loading && !error && papers.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                    <BookOpen
                        size={42}
                        className="mx-auto text-gray-400 mb-3"
                    />

                    <h2 className="font-semibold text-gray-700">
                        No past-question papers available
                    </h2>

                    <p className="text-gray-500 text-sm mt-2">
                        Published papers for your courses will appear here.
                    </p>
                </div>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {papers.map((paper) => (
                    <div
                        key={paper._id}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-blue-50 p-3 rounded-lg">
                                <FileText className="text-blue-600" />
                            </div>

                            <div>
                                <h2 className="font-semibold text-gray-800">
                                    {paper.title}
                                </h2>

                                <p className="text-sm text-gray-500">
                                    {paper.academicYear}
                                </p>
                            </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                            {paper.courseId?.courseCode} -{" "}
                            {paper.courseId?.courseTitle}
                        </p>

                        <p className="text-sm text-gray-500 mb-4">
                            {paper.semester === "first"
                                ? "First Semester"
                                : "Second Semester"}
                        </p>

                        {paper.description && (
                            <p className="text-sm text-gray-600 mb-4">
                                {paper.description}
                            </p>
                        )}

                        <div className="mt-auto space-y-3">
                            {paper.fileUrl && (
                                <a
                                    href={paper.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-sm text-blue-600 hover:underline"
                                >
                                    View original question paper
                                </a>
                            )}

                            <button
                                onClick={() =>
                                    navigate(
                                        `/me/question-bank/papers/${paper._id}`
                                    )
                                }
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition"
                            >
                                Browse Questions
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudentQuestionBank;
