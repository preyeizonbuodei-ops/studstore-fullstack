import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
    ArrowLeft,
    RefreshCw,
    MessageSquareText,
    MessageCircle,
    Send,
    Trash2,
    LoaderCircle,
    ShieldCheck,
    UserRound,
    Clock3,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

import useAdminCommentStore from "../../../Store/AdminCommentStore";

const getStudentName = (comment) => {
    const author = comment?.username;

    if (!author || typeof author !== "object") {
        return "StudStore Student";
    }

    const fullName = [
        author.firstName,
        author.lastName,
    ]
        .filter(Boolean)
        .join(" ")
        .trim();

    return (
        author.displayName ||
        author.fullName ||
        author.name ||
        fullName ||
        author.username ||
        "StudStore Student"
    );
};

const getReplyAuthorName = (reply) => {
    if (reply?.authorType === "admin") {
        return "StudStore Admin";
    }

    const author = reply?.user;

    if (!author || typeof author !== "object") {
        return "StudStore Student";
    }

    const fullName = [
        author.firstName,
        author.lastName,
    ]
        .filter(Boolean)
        .join(" ")
        .trim();

    return (
        author.displayName ||
        author.fullName ||
        author.name ||
        fullName ||
        author.username ||
        "StudStore Student"
    );
};

const getInitials = (name) =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("");

const formatDate = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "";
    }

    return parsedDate.toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
};

const AdminComment = () => {
    const comments = useAdminCommentStore(
        (state) => state.comments
    );

    const selectedComment = useAdminCommentStore(
        (state) => state.selectedComment
    );

    const loading = useAdminCommentStore(
        (state) => state.loading
    );

    const loadingMore = useAdminCommentStore(
        (state) => state.loadingMore
    );

    const error = useAdminCommentStore(
        (state) => state.error
    );

    const successMessage = useAdminCommentStore(
        (state) => state.successMessage
    );

    const pagination = useAdminCommentStore(
        (state) => state.pagination
    );

    const getAllComments = useAdminCommentStore(
        (state) => state.getAllComments
    );

    const loadMoreComments = useAdminCommentStore(
        (state) => state.loadMoreComments
    );

    const addAdminCommentReply = useAdminCommentStore(
        (state) => state.addAdminCommentReply
    );

    const deleteComment = useAdminCommentStore(
        (state) => state.deleteComment
    );

    const clearMessages = useAdminCommentStore(
        (state) => state.clearMessages
    );

    const [replyDrafts, setReplyDrafts] = useState({});
    const [expandedComments, setExpandedComments] = useState({});
    const [submittingReplyId, setSubmittingReplyId] = useState(null);
    const [deletingCommentId, setDeletingCommentId] = useState(null);
    const [actionError, setActionError] = useState("");

    // Load the first page of comments when this page opens.
    useEffect(() => {
        getAllComments({
            page: 1,
            limit: 10,
        }).catch(() => {
            // The store records the error for display.
        });
    }, [getAllComments]);

    const handleRefresh = async () => {
        clearMessages();
        setActionError("");

        try {
            await getAllComments({
                page: 1,
                limit: 10,
            });
        } catch {
            // The store records the error for display.
        }
    };

    const handleReplyChange = (commentId, value) => {
        setReplyDrafts((previous) => ({
            ...previous,
            [commentId]: value,
        }));
    };

    const handleReplySubmit = async (event, comment) => {
        event.preventDefault();

        const commentId = String(comment._id);
        const text = (replyDrafts[commentId] || "").trim();

        if (comment.isDeleted) {
            setActionError(
                "You cannot reply to a removed comment."
            );
            return;
        }

        if (!text) {
            setActionError("Please enter your reply.");
            return;
        }

        if (text.length > 2000) {
            setActionError(
                "Your reply cannot exceed 2,000 characters."
            );
            return;
        }

        setActionError("");
        clearMessages();
        setSubmittingReplyId(commentId);

        try {
            await addAdminCommentReply(commentId, text);

            setReplyDrafts((previous) => ({
                ...previous,
                [commentId]: "",
            }));

            setExpandedComments((previous) => ({
                ...previous,
                [commentId]: true,
            }));
        } catch (replyError) {
            setActionError(
                replyError?.response?.data?.message ||
                    replyError?.message ||
                    "Unable to send your reply."
            );
        } finally {
            setSubmittingReplyId(null);
        }
    };

    const handleDeleteComment = async (comment) => {
        const commentId = String(comment._id);

        if (comment.isDeleted) {
            return;
        }

        const hasReplies =
            Array.isArray(comment.replies) &&
            comment.replies.length > 0;

        const confirmationMessage = hasReplies
            ? "Remove this comment? The original comment will be replaced with a removal notice, and the existing replies will remain visible."
            : "Remove this comment permanently? This action cannot be undone.";

        if (!window.confirm(confirmationMessage)) {
            return;
        }

        clearMessages();
        setActionError("");
        setDeletingCommentId(commentId);

        try {
            await deleteComment(commentId);
        } catch (deleteError) {
            setActionError(
                deleteError?.response?.data?.message ||
                    deleteError?.message ||
                    "Unable to remove this comment."
            );
        } finally {
            setDeletingCommentId(null);
        }
    };

    const toggleReplies = (commentId) => {
        setExpandedComments((previous) => ({
            ...previous,
            [commentId]: !previous[commentId],
        }));
    };

    const visibleComments = comments;
    const removedCount = visibleComments.filter(
        (comment) => comment.isDeleted
    ).length;

    return (
        <main className="min-h-screen bg-gray-50 px-3 py-5 sm:px-6 sm:py-8 lg:px-10">
            <div className="mx-auto max-w-5xl">
                {/* Header */}
                <header className="mb-6 overflow-hidden rounded-2xl bg-blue-950 text-white shadow-sm sm:mb-8 sm:rounded-3xl">
                    <div className="p-5 sm:p-8">
                        <NavLink
                            to="/admin-dashboard"
                            className="mb-6 inline-flex items-center gap-2 text-sm text-blue-100 transition hover:text-white"
                        >
                            <ArrowLeft size={17} />
                            Back to dashboard
                        </NavLink>

                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 sm:h-14 sm:w-14">
                                    <MessageSquareText size={27} />
                                </div>

                                <div>
                                    <h1 className="text-2xl font-bold sm:text-3xl">
                                        Student Comments
                                    </h1>

                                    <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
                                        Review student feedback, respond as
                                        StudStore Admin, and moderate comments
                                        that violate community standards.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleRefresh}
                                disabled={loading || loadingMore}
                                className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <RefreshCw
                                    size={16}
                                    className={
                                        loading ? "animate-spin" : ""
                                    }
                                />
                                Refresh
                            </button>
                        </div>
                    </div>
                </header>

                {/* Summary */}
                <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-gray-500">
                                Total comments
                            </span>

                            <MessageSquareText
                                size={20}
                                className="text-blue-600"
                            />
                        </div>

                        <p className="mt-3 text-2xl font-bold text-gray-900">
                            {pagination.total}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                            Across Student Voices
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-gray-500">
                                Showing on this page
                            </span>

                            <MessageCircle
                                size={20}
                                className="text-purple-600"
                            />
                        </div>

                        <p className="mt-3 text-2xl font-bold text-gray-900">
                            {visibleComments.length}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                            Comments currently loaded
                        </p>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-gray-500">
                                Removed comments
                            </span>

                            <ShieldCheck
                                size={20}
                                className="text-red-600"
                            />
                        </div>

                        <p className="mt-3 text-2xl font-bold text-gray-900">
                            {removedCount}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                            Removed items in the loaded list
                        </p>
                    </div>
                </section>

                {/* Feedback messages */}
                {successMessage && (
                    <div
                        role="status"
                        className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                    >
                        {successMessage}
                    </div>
                )}

                {(actionError || error) && (
                    <div
                        role="alert"
                        className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                        {actionError || error}
                    </div>
                )}

                {/* Comments list */}
                <section>
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                Community discussion
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Read comments and manage responses.
                            </p>
                        </div>

                        {pagination.total > 0 && (
                            <span className="text-sm text-gray-500">
                                {visibleComments.length} loaded of{" "}
                                {pagination.total}
                            </span>
                        )}
                    </div>

                    {loading && visibleComments.length === 0 ? (
                        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-8 text-center">
                            <LoaderCircle
                                size={32}
                                className="animate-spin text-blue-600"
                            />

                            <p className="mt-4 text-sm text-gray-500">
                                Loading student comments...
                            </p>
                        </div>
                    ) : visibleComments.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-14 text-center">
                            <MessageSquareText
                                size={36}
                                className="mx-auto text-gray-300"
                            />

                            <h3 className="mt-4 font-semibold text-gray-800">
                                No student comments yet
                            </h3>

                            <p className="mt-2 text-sm text-gray-500">
                                Comments submitted on Student Voices will
                                appear here.
                            </p>

                            {error && (
                                <button
                                    type="button"
                                    onClick={handleRefresh}
                                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
                                >
                                    <RefreshCw size={15} />
                                    Try again
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {visibleComments.map((comment) => {
                                const commentId = String(comment._id);
                                const authorName =
                                    getStudentName(comment);

                                const replies = Array.isArray(
                                    comment.replies
                                )
                                    ? comment.replies
                                    : [];

                                const isExpanded =
                                    Boolean(expandedComments[commentId]) ||
                                    Boolean(
                                        submittingReplyId === commentId
                                    );

                                const isSubmitting =
                                    submittingReplyId === commentId;

                                const isDeleting =
                                    deletingCommentId === commentId;

                                return (
                                    <article
                                        key={commentId}
                                        className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
                                            comment.isDeleted
                                                ? "border-red-100"
                                                : "border-gray-100"
                                        }`}
                                    >
                                        {/* Comment heading */}
                                        <div className="p-4 sm:p-5">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-800">
                                                    {getInitials(
                                                        authorName
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="break-words text-sm font-bold text-gray-900">
                                                            {authorName}
                                                        </h3>

                                                        <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600">
                                                            Student
                                                        </span>

                                                        {comment.isDeleted && (
                                                            <span className="rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700">
                                                                Removed
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                                                        <Clock3 size={12} />
                                                        <span>
                                                            {formatDate(
                                                                comment.createdAt
                                                            )}
                                                        </span>
                                                    </div>

                                                    <p
                                                        className={`mt-3 whitespace-pre-wrap break-words text-sm leading-6 ${
                                                            comment.isDeleted
                                                                ? "italic text-gray-400"
                                                                : "text-gray-700"
                                                        }`}
                                                    >
                                                        {comment.comment}
                                                    </p>

                                                    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                toggleReplies(
                                                                    commentId
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                                                        >
                                                            <MessageCircle
                                                                size={15}
                                                            />

                                                            {replies.length}{" "}
                                                            {replies.length === 1
                                                                ? "reply"
                                                                : "replies"}

                                                            {isExpanded ? (
                                                                <ChevronUp
                                                                    size={14}
                                                                />
                                                            ) : (
                                                                <ChevronDown
                                                                    size={14}
                                                                />
                                                            )}
                                                        </button>

                                                        {!comment.isDeleted && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setExpandedComments(
                                                                        (
                                                                            previous
                                                                        ) => ({
                                                                            ...previous,
                                                                            [commentId]: true,
                                                                        })
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                                                            >
                                                                <MessageSquareText
                                                                    size={14}
                                                                />
                                                                Reply as admin
                                                            </button>
                                                        )}

                                                        {!comment.isDeleted && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDeleteComment(
                                                                        comment
                                                                    )
                                                                }
                                                                disabled={
                                                                    isDeleting
                                                                }
                                                                className="ml-auto inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                            >
                                                                {isDeleting ? (
                                                                    <LoaderCircle
                                                                        size={14}
                                                                        className="animate-spin"
                                                                    />
                                                                ) : (
                                                                    <Trash2
                                                                        size={14}
                                                                    />
                                                                )}

                                                                {isDeleting
                                                                    ? "Removing..."
                                                                    : "Remove comment"}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Existing replies and admin reply form */}
                                        {isExpanded && (
                                            <div className="border-t border-gray-100 bg-gray-50/70 p-4 sm:p-5">
                                                <div className="space-y-3">
                                                    {replies.map(
                                                        (reply, index) => {
                                                            const isAdminReply =
                                                                reply.authorType ===
                                                                "admin";

                                                            const replyAuthor =
                                                                getReplyAuthorName(
                                                                    reply
                                                                );

                                                            return (
                                                                <div
                                                                    key={
                                                                        reply._id ||
                                                                        `${commentId}-reply-${index}`
                                                                    }
                                                                    className={`rounded-xl border p-3 sm:p-4 ${
                                                                        isAdminReply
                                                                            ? "border-blue-100 bg-blue-50/80"
                                                                            : "border-gray-100 bg-white"
                                                                    }`}
                                                                >
                                                                    <div className="flex items-start gap-3">
                                                                        <div
                                                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                                                                isAdminReply
                                                                                    ? "bg-blue-950 text-white"
                                                                                    : "bg-gray-100 text-gray-600"
                                                                            }`}
                                                                        >
                                                                            {isAdminReply ? (
                                                                                <ShieldCheck
                                                                                    size={16}
                                                                                />
                                                                            ) : (
                                                                                <UserRound
                                                                                    size={16}
                                                                                />
                                                                            )}
                                                                        </div>

                                                                        <div className="min-w-0 flex-1">
                                                                            <div className="flex flex-wrap items-center gap-2">
                                                                                <span className="text-xs font-bold text-gray-900">
                                                                                    {replyAuthor}
                                                                                </span>

                                                                                {isAdminReply && (
                                                                                    <span className="rounded-full bg-blue-950 px-2 py-0.5 text-[10px] font-semibold text-white">
                                                                                        Official response
                                                                                    </span>
                                                                                )}

                                                                                {reply.editedAt && (
                                                                                    <span className="text-[11px] text-gray-400">
                                                                                        Edited
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                                                                                {reply.text}
                                                                            </p>

                                                                            {reply.createdAt && (
                                                                                <p className="mt-2 text-[11px] text-gray-400">
                                                                                    {formatDate(
                                                                                        reply.createdAt
                                                                                    )}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                    )}

                                                    {replies.length === 0 && (
                                                        <p className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-5 text-center text-sm text-gray-500">
                                                            No replies yet.
                                                            You can send the
                                                            first response.
                                                        </p>
                                                    )}
                                                </div>

                                                {!comment.isDeleted && (
                                                    <form
                                                        onSubmit={(event) =>
                                                            handleReplySubmit(
                                                                event,
                                                                comment
                                                            )
                                                        }
                                                        className="mt-4 rounded-xl border border-gray-200 bg-white p-3 sm:p-4"
                                                    >
                                                        <div className="mb-3 flex items-center gap-2">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-950 text-white">
                                                                <ShieldCheck
                                                                    size={16}
                                                                />
                                                            </div>

                                                            <div>
                                                                <p className="text-sm font-bold text-gray-900">
                                                                    StudStore Admin
                                                                </p>

                                                                <p className="text-xs text-gray-500">
                                                                    Official response
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <textarea
                                                            value={
                                                                replyDrafts[
                                                                    commentId
                                                                ] || ""
                                                            }
                                                            onChange={(event) =>
                                                                handleReplyChange(
                                                                    commentId,
                                                                    event.target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder="Write a helpful response to the student..."
                                                            rows={3}
                                                            maxLength={2000}
                                                            disabled={
                                                                isSubmitting
                                                            }
                                                            className="w-full resize-y rounded-lg border border-gray-200 p-3 text-sm leading-6 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
                                                        />

                                                        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                            <span className="text-xs text-gray-400">
                                                                {
                                                                    (
                                                                        replyDrafts[
                                                                            commentId
                                                                        ] || ""
                                                                    ).length
                                                                }{" "}
                                                                / 2,000
                                                                characters
                                                            </span>

                                                            <button
                                                                type="submit"
                                                                disabled={
                                                                    isSubmitting ||
                                                                    !(
                                                                        replyDrafts[
                                                                            commentId
                                                                        ] || ""
                                                                    ).trim()
                                                                }
                                                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                {isSubmitting ? (
                                                                    <LoaderCircle
                                                                        size={16}
                                                                        className="animate-spin"
                                                                    />
                                                                ) : (
                                                                    <Send
                                                                        size={15}
                                                                    />
                                                                )}

                                                                {isSubmitting
                                                                    ? "Sending reply..."
                                                                    : "Send admin reply"}
                                                            </button>
                                                        </div>
                                                    </form>
                                                )}
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {visibleComments.length > 0 &&
                        pagination.hasMore && (
                            <div className="mt-6 flex justify-center">
                                <button
                                    type="button"
                                    onClick={() =>
                                        loadMoreComments().catch(() => {})
                                    }
                                    disabled={loadingMore || loading}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loadingMore ? (
                                        <LoaderCircle
                                            size={17}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <MessageSquareText size={17} />
                                    )}

                                    {loadingMore
                                        ? "Loading more comments..."
                                        : "Load more comments"}
                                </button>
                            </div>
                        )}
                </section>

                <footer className="mt-8 rounded-xl border border-gray-100 bg-white p-4 text-xs leading-5 text-gray-500 sm:p-5">
                    <div className="flex items-start gap-3">
                        <ShieldCheck
                            size={19}
                            className="mt-0.5 shrink-0 text-blue-700"
                        />

                        <p>
                            Use moderation responsibly. Remove comments
                            that violate StudStore community standards.
                            Comments with existing replies should retain
                            their discussion history when removed.
                        </p>
                    </div>
                </footer>
            </div>
        </main>
    );
};

export default AdminComment;