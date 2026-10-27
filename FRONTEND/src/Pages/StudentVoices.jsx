import { useEffect, useState } from "react";
import {
    MessagesSquare,
    MessageCircle,
    Plus,
    X,
    Send,
    CalendarDays,
    LoaderCircle,
    RefreshCw,
    MessageSquareText,
} from "lucide-react";

import useStudentCommentStore from "../Store/UserCommentStore";

const formatDate = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "";
    }

    return parsedDate.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

const getStudentName = (comment) => {
    const student = comment?.username;

    // Supports populated user data if the backend returns it.
    if (student && typeof student === "object") {
        const fullName = [
            student.firstName,
            student.lastName,
        ]
            .filter(Boolean)
            .join(" ")
            .trim();

        return (
            student.displayName ||
            student.fullName ||
            student.name ||
            fullName ||
            "StudStore Student"
        );
    }

    // The current controller may return only the user ID.
    return "StudStore Student";
};

const getInitials = (name) => {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");
};

const StudentVoices = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    const comments = useStudentCommentStore(
        (state) => state.comments
    );

    const loading = useStudentCommentStore(
        (state) => state.loading
    );

    const error = useStudentCommentStore(
        (state) => state.error
    );

    const successMessage = useStudentCommentStore(
        (state) => state.successMessage
    );

    const getAllComments = useStudentCommentStore(
        (state) => state.getAllComments
    );

    const createComment = useStudentCommentStore(
        (state) => state.createComment
    );

    const clearMessages = useStudentCommentStore(
        (state) => state.clearMessages
    );

    // Load the comments when the page opens.
    useEffect(() => {
        getAllComments().catch(() => {
            // The store records the error for display.
        });
    }, [getAllComments]);

    const openForm = () => {
        clearMessages();
        setFormError("");
        setCommentText("");
        setIsFormOpen(true);
    };

    const closeForm = () => {
        if (submitting) return;

        setIsFormOpen(false);
        setFormError("");
        setCommentText("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const trimmedComment = commentText.trim();

        if (!trimmedComment) {
            setFormError("Please enter your comment.");
            return;
        }

        if (trimmedComment.length < 3) {
            setFormError(
                "Your comment must contain at least 3 characters."
            );
            return;
        }

        if (trimmedComment.length > 2000) {
            setFormError(
                "Your comment cannot exceed 2,000 characters."
            );
            return;
        }

        setSubmitting(true);
        setFormError("");
        clearMessages();

        try {
            await createComment(trimmedComment);

            setCommentText("");
            setIsFormOpen(false);

            // Refresh to show the latest server data.
            await getAllComments().catch(() => {});
        } catch (submitError) {
            setFormError(
                submitError?.response?.data?.message ||
                    submitError?.message ||
                    "Unable to submit your comment. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-5xl">

                {/* Page Heading */}
                <section className="mb-8 overflow-hidden rounded-3xl bg-blue-950 text-white shadow-lg">
                    <div className="relative p-6 sm:p-9">
                        <div className="relative z-10 max-w-2xl">
                            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                                <MessagesSquare size={30} />
                            </div>

                            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-200">
                                Your voice matters
                            </p>

                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                Student Voices
                            </h1>

                            <p className="mt-3 max-w-xl leading-7 text-blue-100">
                                Share your experience, suggest new
                                features, and help us make StudStore
                                better for every student.
                            </p>

                            <button
                                type="button"
                                onClick={openForm}
                                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-blue-950 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-950"
                            >
                                <Plus size={19} />
                                Make a Comment
                            </button>
                        </div>

                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -right-10 -top-16 h-64 w-64 rounded-full border-[35px] border-white/5 sm:right-0"
                        />
                    </div>
                </section>

                {/* Page Introduction */}
                <section className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            What students are saying
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                            Read feedback from fellow students and
                            share your own experience.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            getAllComments().catch(() => {});
                        }}
                        disabled={loading}
                        className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                    >
                        <RefreshCw
                            size={16}
                            className={
                                loading ? "animate-spin" : ""
                            }
                        />
                        Refresh
                    </button>
                </section>

                {/* Success Message */}
                {successMessage && (
                    <div
                        role="status"
                        className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                    >
                        {successMessage}
                    </div>
                )}

                {/* Error Message */}
                {error && !isFormOpen && (
                    <div
                        role="alert"
                        className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                        <p>{error}</p>

                        <button
                            type="button"
                            onClick={() =>
                                getAllComments().catch(() => {})
                            }
                            className="mt-2 font-semibold underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {loading && comments.length === 0 && (
                    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8">
                        <LoaderCircle
                            size={32}
                            className="animate-spin text-blue-950"
                        />

                        <p className="mt-3 text-sm text-slate-500">
                            Loading student comments...
                        </p>
                    </div>
                )}

                {/* Empty State */}
                {!loading &&
                    !error &&
                    comments.length === 0 && (
                        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center sm:py-16">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-950">
                                <MessageCircle size={32} />
                            </div>

                            <h3 className="mt-5 text-lg font-bold text-slate-900">
                                Be the first to share your voice
                            </h3>

                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                There are no comments yet. Tell us
                                what you think about StudStore and
                                help us improve the learning
                                experience.
                            </p>

                            <button
                                type="button"
                                onClick={openForm}
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-900"
                            >
                                <Plus size={18} />
                                Write the First Comment
                            </button>
                        </section>
                    )}

                {/* Comments List */}
                {comments.length > 0 && (
                    <section className="space-y-4">
                        {comments.map((comment) => {
                            const studentName =
                                getStudentName(comment);

                            return (
                                <article
                                    key={comment._id}
                                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-6"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-950">
                                            {getInitials(studentName) ||
                                                "S"}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <h3 className="font-semibold text-slate-900">
                                                    {studentName}
                                                </h3>

                                                {comment.createdAt && (
                                                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                                                        <CalendarDays
                                                            size={14}
                                                        />
                                                        {formatDate(
                                                            comment.createdAt
                                                        )}
                                                    </span>
                                                )}
                                            </div>

                                            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                                                {comment.comment}
                                            </p>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                )}

                {/* Bottom Call to Action */}
                {comments.length > 0 && (
                    <section className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:flex-row sm:p-6">
                        <div className="flex items-start gap-3">
                            <MessageSquareText
                                size={24}
                                className="mt-1 shrink-0 text-blue-950"
                            />

                            <div>
                                <h3 className="font-bold text-blue-950">
                                    Have something to share?
                                </h3>

                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                    Your ideas and feedback help shape
                                    the future of StudStore.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={openForm}
                            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-900"
                        >
                            <Plus size={18} />
                            Make a Comment
                        </button>
                    </section>
                )}
            </div>

            {/* Make a Comment Modal */}
            {isFormOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeForm();
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="feedback-modal-title"
                        className="my-auto w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl sm:p-7"
                    >
                        <div className="mb-6 flex items-start justify-between gap-4">
                            <div>
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-950">
                                    <MessagesSquare size={24} />
                                </div>

                                <h2
                                    id="feedback-modal-title"
                                    className="text-2xl font-bold text-slate-900"
                                >
                                    Make a Comment
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Tell us about your experience
                                    with StudStore or suggest what
                                    we should improve.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeForm}
                                disabled={submitting}
                                aria-label="Close feedback form"
                                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <label
                                htmlFor="student-comment"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Your comment
                            </label>

                            <textarea
                                id="student-comment"
                                value={commentText}
                                onChange={(event) => {
                                    setCommentText(
                                        event.target.value
                                    );
                                    setFormError("");
                                }}
                                placeholder="What do you like about StudStore? What would you like us to improve?"
                                rows={6}
                                maxLength={2000}
                                required
                                autoFocus
                                disabled={submitting}
                                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-950 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                            />

                            <div className="mt-2 flex items-center justify-between gap-3">
                                <p className="text-xs text-slate-500">
                                    Be respectful. Do not include
                                    passwords or private information.
                                </p>

                                <span className="shrink-0 text-xs text-slate-400">
                                    {commentText.length}/2000
                                </span>
                            </div>

                            {formError && (
                                <div
                                    role="alert"
                                    className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                                >
                                    {formError}
                                </div>
                            )}

                            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    disabled={submitting}
                                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        submitting ||
                                        !commentText.trim()
                                    }
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting ? (
                                        <>
                                            <LoaderCircle
                                                size={18}
                                                className="animate-spin"
                                            />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={17} />
                                            Submit Comment
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </main>
    );
};

export default StudentVoices;