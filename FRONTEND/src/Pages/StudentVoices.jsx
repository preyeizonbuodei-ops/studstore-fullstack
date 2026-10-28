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
    Heart,
    Reply,
    Pencil,
    Trash2,
} from "lucide-react";
import useStudentCommentStore from "../Store/UserCommentStore";

const formatDate = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "";

    return parsedDate.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

const getDisplayName = (user) => {
    if (!user || typeof user !== "object") return "";

    const firstAndLastName = [
        user.firstName,
        user.lastName,
    ]
        .filter(Boolean)
        .join(" ")
        .trim();

    return (
        user.displayName ||
        user.fullName ||
        user.name ||
        firstAndLastName ||
        user.username ||
        "StudStore Student"
    );
};

const getStudentName = (comment) => {
    const author = comment?.username;

    return author && typeof author === "object"
        ? getDisplayName(author)
        : "StudStore Student";
};

// Identify admin replies using the backend's authorType field.
// adminId is included as a fallback for replies that have it but
// are missing authorType.
const isAdminReply = (reply) => {
    return (
        String(reply?.authorType || "").toLowerCase() === "admin" ||
        Boolean(reply?.adminId)
    );
};

const getReplyName = (reply) => {
    if (isAdminReply(reply)) {
        return "StudStore Admin";
    }

    const author = reply?.user;

    return author && typeof author === "object"
        ? getDisplayName(author)
        : "StudStore Student";
};

const getInitials = (name) =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("");

const StudentVoices = () => {
    // Create comment form
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    // Add replies
    const [replyDrafts, setReplyDrafts] = useState({});
    const [replyingTo, setReplyingTo] = useState(null);
    const [replying, setReplying] = useState(false);

    // Reply editing and deleting
    const [editingReply, setEditingReply] = useState(null);
    const [replyEditDraft, setReplyEditDraft] = useState("");
    const [savingReplyEdit, setSavingReplyEdit] = useState(false);
    const [deletingReplyId, setDeletingReplyId] = useState(null);

    // Likes
    const [likingId, setLikingId] = useState(null);
    const [likeOverrides, setLikeOverrides] = useState({});

    // Comment editing and deleting
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editDraft, setEditDraft] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [interactionError, setInteractionError] = useState("");

    // Store state
    const comments = useStudentCommentStore((state) => state.comments);
    const loading = useStudentCommentStore((state) => state.loading);
    const loadingMore = useStudentCommentStore((state) => state.loadingMore);
    const error = useStudentCommentStore((state) => state.error);
    const successMessage = useStudentCommentStore(
        (state) => state.successMessage
    );
    const pagination = useStudentCommentStore((state) => state.pagination);

    // Store actions
    const getAllComments = useStudentCommentStore(
        (state) => state.getAllComments
    );
    const loadMoreComments = useStudentCommentStore(
        (state) => state.loadMoreComments
    );
    const createComment = useStudentCommentStore(
        (state) => state.createComment
    );
    const updateComment = useStudentCommentStore(
        (state) => state.updateComment
    );
    const deleteComment = useStudentCommentStore(
        (state) => state.deleteComment
    );
    const toggleCommentLike = useStudentCommentStore(
        (state) => state.toggleCommentLike
    );
    const addCommentReply = useStudentCommentStore(
        (state) => state.addCommentReply
    );
    const updateCommentReply = useStudentCommentStore(
        (state) => state.updateCommentReply
    );
    const deleteCommentReply = useStudentCommentStore(
        (state) => state.deleteCommentReply
    );
    const clearMessages = useStudentCommentStore(
        (state) => state.clearMessages
    );

    useEffect(() => {
        getAllComments().catch(() => {});
    }, [getAllComments]);

    // CREATE COMMENT
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

        const text = commentText.trim();

        if (text.length < 3) {
            setFormError(
                "Your comment must contain at least 3 characters."
            );
            return;
        }

        if (text.length > 2000) {
            setFormError(
                "Your comment cannot exceed 2,000 characters."
            );
            return;
        }

        setSubmitting(true);
        setFormError("");
        clearMessages();

        try {
            await createComment(text);
            setCommentText("");
            setIsFormOpen(false);
            await getAllComments().catch(() => {});
        } catch (submitError) {
            const status = submitError?.response?.status;
            const message =
                submitError?.response?.data?.message ||
                submitError?.message ||
                "Unable to submit your comment. Please try again.";

            setFormError(
                status === 401
                    ? `${message} Check that your login and comment requests use the same backend.`
                    : message
            );
        } finally {
            setSubmitting(false);
        }
    };

    // LIKE OR UNLIKE
    const handleLike = async (commentId) => {
        setInteractionError("");
        setLikingId(commentId);

        try {
            const result = await toggleCommentLike(commentId);

            if (typeof result?.liked === "boolean") {
                setLikeOverrides((current) => ({
                    ...current,
                    [commentId]: result.liked,
                }));
            }
        } catch (likeError) {
            setInteractionError(
                likeError?.response?.data?.message ||
                    likeError?.message ||
                    "Unable to update this like."
            );
        } finally {
            setLikingId(null);
        }
    };

    // ADD REPLY
    const handleReplySubmit = async (event, commentId) => {
        event.preventDefault();

        const text = (replyDrafts[commentId] || "").trim();

        if (text.length < 1 || text.length > 2000) {
            setInteractionError(
                "Your reply must contain between 1 and 2,000 characters."
            );
            return;
        }

        setInteractionError("");
        setReplying(true);

        try {
            await addCommentReply(commentId, text);

            setReplyDrafts((current) => ({
                ...current,
                [commentId]: "",
            }));

            setReplyingTo(null);
        } catch (replyError) {
            setInteractionError(
                replyError?.response?.data?.message ||
                    replyError?.message ||
                    "Unable to add your reply."
            );
        } finally {
            setReplying(false);
        }
    };

    // EDIT COMMENT
    const startEditing = (comment) => {
        if (!comment.isOwnComment || comment.isDeleted) return;

        setEditingCommentId(comment._id);
        setEditDraft(comment.comment || "");
        setInteractionError("");
        clearMessages();

        setReplyingTo(null);
        setEditingReply(null);
        setReplyEditDraft("");
    };

    const cancelEditing = () => {
        if (savingEdit) return;

        setEditingCommentId(null);
        setEditDraft("");
        setInteractionError("");
    };

    const handleEditSubmit = async (event, commentId) => {
        event.preventDefault();

        const text = editDraft.trim();

        if (text.length < 3 || text.length > 2000) {
            setInteractionError(
                "Your comment must contain between 3 and 2,000 characters."
            );
            return;
        }

        setSavingEdit(true);
        setInteractionError("");
        clearMessages();

        try {
            await updateComment(commentId, text);
            setEditingCommentId(null);
            setEditDraft("");
        } catch (editError) {
            setInteractionError(
                editError?.response?.data?.message ||
                    editError?.message ||
                    "Unable to update your comment."
            );
        } finally {
            setSavingEdit(false);
        }
    };

    // DELETE COMMENT
    const handleDelete = async (comment) => {
        if (!comment.isOwnComment || comment.isDeleted) return;

        const hasReplies =
            Array.isArray(comment.replies) &&
            comment.replies.length > 0;

        const confirmed = window.confirm(
            hasReplies
                ? "Delete this comment? Its replies will remain visible."
                : "Are you sure you want to delete this comment?"
        );

        if (!confirmed) return;

        setDeletingId(comment._id);
        setInteractionError("");
        clearMessages();

        try {
            await deleteComment(comment._id);

            setLikeOverrides((current) => {
                const next = { ...current };
                delete next[comment._id];
                return next;
            });

            if (editingCommentId === comment._id) {
                setEditingCommentId(null);
                setEditDraft("");
            }

            if (replyingTo === comment._id) {
                setReplyingTo(null);
            }
        } catch (deleteError) {
            setInteractionError(
                deleteError?.response?.data?.message ||
                    deleteError?.message ||
                    "Unable to delete your comment."
            );
        } finally {
            setDeletingId(null);
        }
    };

    // EDIT REPLY
    const startEditingReply = (commentId, reply) => {
        if (!reply.isOwnReply) return;

        setEditingReply({
            commentId: String(commentId),
            replyId: String(reply._id),
        });

        setReplyEditDraft(reply.text || "");
        setInteractionError("");
        setReplyingTo(null);
        setEditingCommentId(null);
        setEditDraft("");
    };

    const cancelEditingReply = () => {
        if (savingReplyEdit) return;

        setEditingReply(null);
        setReplyEditDraft("");
        setInteractionError("");
    };

    const handleReplyEditSubmit = async (
        event,
        commentId,
        replyId
    ) => {
        event.preventDefault();

        const text = replyEditDraft.trim();

        if (text.length < 1 || text.length > 2000) {
            setInteractionError(
                "Your reply must contain between 1 and 2,000 characters."
            );
            return;
        }

        setSavingReplyEdit(true);
        setInteractionError("");
        clearMessages();

        try {
            await updateCommentReply(commentId, replyId, text);

            setEditingReply(null);
            setReplyEditDraft("");
        } catch (editError) {
            setInteractionError(
                editError?.response?.data?.message ||
                    editError?.message ||
                    "Unable to update your reply."
            );
        } finally {
            setSavingReplyEdit(false);
        }
    };

    // DELETE REPLY
    const handleReplyDelete = async (commentId, reply) => {
        if (!reply.isOwnReply) return;

        const confirmed = window.confirm(
            "Are you sure you want to delete this reply?"
        );

        if (!confirmed) return;

        setDeletingReplyId(String(reply._id));
        setInteractionError("");
        clearMessages();

        try {
            await deleteCommentReply(commentId, reply._id);

            if (
                editingReply?.replyId === String(reply._id)
            ) {
                setEditingReply(null);
                setReplyEditDraft("");
            }
        } catch (deleteError) {
            setInteractionError(
                deleteError?.response?.data?.message ||
                    deleteError?.message ||
                    "Unable to delete your reply."
            );
        } finally {
            setDeletingReplyId(null);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 px-3 py-4 sm:px-6 sm:py-8 lg:px-10">
            <div className="mx-auto max-w-5xl">
                {/* Page heading */}
                <section className="mb-5 overflow-hidden rounded-2xl bg-blue-950 text-white shadow-lg sm:mb-8 sm:rounded-3xl">
                    <div className="relative p-5 sm:p-9">
                        <div className="relative z-10 max-w-2xl">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 sm:mb-5 sm:h-14 sm:w-14">
                                <MessagesSquare size={27} />
                            </div>

                            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-200 sm:text-sm">
                                Your voice matters
                            </p>

                            <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
                                Student Voices
                            </h1>

                            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100 sm:mt-3 sm:text-base sm:leading-7">
                                Share your experience, suggest new
                                features, and help us make StudStore
                                better for every student.
                            </p>

                            <button
                                type="button"
                                onClick={openForm}
                                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-950 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-950 sm:mt-6 sm:px-5 sm:py-3 sm:text-base"
                            >
                                <Plus size={18} />
                                Make a Comment
                            </button>
                        </div>

                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -right-10 -top-16 hidden h-64 w-64 rounded-full border-[35px] border-white/5 sm:block sm:right-0"
                        />
                    </div>
                </section>

                {/* Feed heading */}
                <section className="mb-4 flex flex-col justify-between gap-3 sm:mb-6 sm:flex-row sm:items-center sm:gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                            What students are saying
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                            Read feedback from fellow students, like
                            comments, reply, and share your own
                            experience.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            getAllComments().catch(() => {})
                        }
                        disabled={loading}
                        className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 sm:px-4 sm:py-2.5"
                    >
                        <RefreshCw
                            size={16}
                            className={loading ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>
                </section>

                {successMessage && (
                    <div
                        role="status"
                        className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 sm:mb-5"
                    >
                        {successMessage}
                    </div>
                )}

                {error && !isFormOpen && (
                    <div
                        role="alert"
                        className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mb-5"
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

                {interactionError && (
                    <div
                        role="alert"
                        className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mb-5"
                    >
                        {interactionError}
                    </div>
                )}

                {/* Loading */}
                {loading && comments.length === 0 && (
                    <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 sm:min-h-48 sm:p-8">
                        <LoaderCircle
                            size={32}
                            className="animate-spin text-blue-950"
                        />
                        <p className="mt-3 text-sm text-slate-500">
                            Loading student comments...
                        </p>
                    </div>
                )}

                {/* Empty feed */}
                {!loading && !error && comments.length === 0 && (
                    <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center sm:px-5 sm:py-16">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-950 sm:h-16 sm:w-16">
                            <MessageCircle size={30} />
                        </div>

                        <h3 className="mt-4 text-lg font-bold text-slate-900 sm:mt-5">
                            Be the first to share your voice
                        </h3>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                            There are no comments yet. Tell us what
                            you think about StudStore and help us
                            improve the learning experience.
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

                {/* Comments feed */}
                {comments.length > 0 && (
                    <section className="space-y-3 sm:space-y-4">
                        {comments.map((comment) => {
                            const studentName = getStudentName(comment);
                            const replies = Array.isArray(comment.replies)
                                ? comment.replies
                                : [];
                            const likes = Array.isArray(comment.likes)
                                ? comment.likes
                                : [];

                            const liked = Object.prototype.hasOwnProperty.call(
                                likeOverrides,
                                comment._id
                            )
                                ? likeOverrides[comment._id]
                                : Boolean(
                                      comment.likedByCurrentUser ||
                                          comment.likedByMe
                                  );

                            const isEditing =
                                editingCommentId === comment._id;
                            const isDeleted = Boolean(comment.isDeleted);

                            return (
                                <article
                                    key={comment._id}
                                    className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-5 md:p-6"
                                >
                                    <div className="flex items-start gap-2.5 sm:gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-950 sm:h-11 sm:w-11 sm:text-sm">
                                            {getInitials(studentName) || "S"}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            {/* Comment author and controls */}
                                            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                                                <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
                                                    {isDeleted
                                                        ? "Deleted comment"
                                                        : studentName}
                                                </h3>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    {comment.createdAt && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 sm:gap-1.5 sm:text-xs">
                                                            <CalendarDays size={13} />
                                                            {formatDate(comment.createdAt)}
                                                        </span>
                                                    )}

                                                    {comment.isOwnComment &&
                                                        !isDeleted &&
                                                        !isEditing && (
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        startEditing(comment)
                                                                    }
                                                                    disabled={
                                                                        deletingId ===
                                                                        comment._id
                                                                    }
                                                                    title="Edit comment"
                                                                    aria-label="Edit your comment"
                                                                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-blue-50 hover:text-blue-950 disabled:opacity-50 sm:p-2"
                                                                >
                                                                    <Pencil size={15} />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleDelete(comment)
                                                                    }
                                                                    disabled={
                                                                        deletingId ===
                                                                        comment._id
                                                                    }
                                                                    title="Delete comment"
                                                                    aria-label="Delete your comment"
                                                                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 sm:p-2"
                                                                >
                                                                    {deletingId ===
                                                                    comment._id ? (
                                                                        <LoaderCircle
                                                                            size={15}
                                                                            className="animate-spin"
                                                                        />
                                                                    ) : (
                                                                        <Trash2 size={15} />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )}
                                                </div>
                                            </div>

                                            {/* Comment text or edit form */}
                                            {isDeleted ? (
                                                <p className="mt-1.5 rounded-2xl bg-slate-100 px-3 py-2.5 text-sm italic leading-6 text-slate-500 sm:mt-3 sm:rounded-none sm:px-0 sm:py-0">
                                                    This comment was deleted.
                                                </p>
                                            ) : isEditing ? (
                                                <form
                                                    onSubmit={(event) =>
                                                        handleEditSubmit(
                                                            event,
                                                            comment._id
                                                        )
                                                    }
                                                    className="mt-2 space-y-2 sm:mt-3"
                                                >
                                                    <textarea
                                                        value={editDraft}
                                                        onChange={(event) =>
                                                            setEditDraft(
                                                                event.target.value
                                                            )
                                                        }
                                                        rows={3}
                                                        maxLength={2000}
                                                        required
                                                        autoFocus
                                                        disabled={savingEdit}
                                                        className="min-h-[80px] max-h-[180px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none focus:border-blue-950 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:min-h-[100px]"
                                                    />

                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <span className="text-xs text-slate-400">
                                                            {editDraft.length}/2000
                                                        </span>

                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={cancelEditing}
                                                                disabled={savingEdit}
                                                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 sm:text-sm"
                                                            >
                                                                Cancel
                                                            </button>

                                                            <button
                                                                type="submit"
                                                                disabled={
                                                                    savingEdit ||
                                                                    editDraft.trim().length < 3
                                                                }
                                                                className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-900 disabled:opacity-50 sm:text-sm"
                                                            >
                                                                {savingEdit && (
                                                                    <LoaderCircle
                                                                        size={14}
                                                                        className="animate-spin"
                                                                    />
                                                                )}
                                                                Save changes
                                                            </button>
                                                        </div>
                                                    </div>
                                                </form>
                                            ) : (
                                                <p className="mt-1.5 whitespace-pre-wrap break-words rounded-2xl bg-slate-100 px-3 py-2.5 text-sm leading-6 text-slate-700 sm:mt-3 sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0 sm:leading-7">
                                                    {comment.comment}
                                                </p>
                                            )}

                                            {/* Like and reply actions */}
                                            {!isDeleted && !isEditing && (
                                                <div className="mt-2 flex flex-wrap items-center gap-1 border-b border-slate-100 pb-2 sm:mt-4 sm:gap-2 sm:pb-4">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleLike(comment._id)
                                                        }
                                                        disabled={
                                                            likingId === comment._id
                                                        }
                                                        aria-pressed={liked}
                                                        className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition disabled:opacity-60 sm:gap-2 sm:text-sm ${
                                                            liked
                                                                ? "text-rose-600"
                                                                : "text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                                                        }`}
                                                    >
                                                        <Heart
                                                            size={16}
                                                            className={
                                                                liked
                                                                    ? "fill-current"
                                                                    : ""
                                                            }
                                                        />
                                                        {likes.length}{" "}
                                                        {likes.length === 1
                                                            ? "Like"
                                                            : "Likes"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setReplyingTo(
                                                                (current) =>
                                                                    current ===
                                                                    comment._id
                                                                        ? null
                                                                        : comment._id
                                                            );
                                                            setInteractionError("");
                                                            setEditingCommentId(null);
                                                            setEditDraft("");
                                                        }}
                                                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-950 sm:gap-2 sm:text-sm"
                                                    >
                                                        <Reply size={16} />
                                                        Reply ({replies.length})
                                                    </button>
                                                </div>
                                            )}

                                            {/* Add reply */}
                                            {!isDeleted &&
                                                replyingTo === comment._id &&
                                                !isEditing && (
                                                    <form
                                                        onSubmit={(event) =>
                                                            handleReplySubmit(
                                                                event,
                                                                comment._id
                                                            )
                                                        }
                                                        className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row"
                                                    >
                                                        <textarea
                                                            value={
                                                                replyDrafts[
                                                                    comment._id
                                                                ] || ""
                                                            }
                                                            onChange={(event) =>
                                                                setReplyDrafts(
                                                                    (current) => ({
                                                                        ...current,
                                                                        [comment._id]:
                                                                            event.target.value,
                                                                    })
                                                                )
                                                            }
                                                            rows={2}
                                                            maxLength={2000}
                                                            placeholder="Write a respectful reply..."
                                                            required
                                                            className="min-h-[64px] max-h-[120px] min-w-0 w-full flex-1 resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-5 text-slate-800 outline-none focus:border-blue-950 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:min-h-0 sm:max-h-none sm:leading-6"
                                                        />

                                                        <button
                                                            type="submit"
                                                            disabled={
                                                                replying ||
                                                                !(replyDrafts[
                                                                    comment._id
                                                                ] || "").trim()
                                                            }
                                                            className="inline-flex h-fit items-center justify-center gap-2 self-end rounded-xl bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60 sm:py-3"
                                                        >
                                                            {replying ? (
                                                                <LoaderCircle
                                                                    size={16}
                                                                    className="animate-spin"
                                                                />
                                                            ) : (
                                                                <Send size={15} />
                                                            )}
                                                            Send reply
                                                        </button>
                                                    </form>
                                                )}

                                            {/* Replies, including official admin replies */}
                                            {replies.length > 0 && (
                                                <div className="ml-1 mt-3 space-y-2.5 border-l-2 border-blue-100 pl-3 sm:ml-0 sm:mt-4 sm:space-y-3 sm:pl-4">
                                                    {replies.map((reply, index) => {
                                                        const adminReply =
                                                            isAdminReply(reply);
                                                        const replyName =
                                                            getReplyName(reply);

                                                        const isEditingThisReply =
                                                            editingReply?.commentId ===
                                                                String(comment._id) &&
                                                            editingReply?.replyId ===
                                                                String(reply._id);

                                                        return (
                                                            <div
                                                                key={
                                                                    reply._id ||
                                                                    `${comment._id}-reply-${index}`
                                                                }
                                                                className={`rounded-xl p-2.5 sm:p-3 ${
                                                                    adminReply
                                                                        ? "border border-blue-200 bg-blue-50"
                                                                        : "bg-slate-50"
                                                                }`}
                                                            >
                                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <span
                                                                            className={`text-xs font-semibold sm:text-sm ${
                                                                                adminReply
                                                                                    ? "text-blue-950"
                                                                                    : "text-slate-800"
                                                                            }`}
                                                                        >
                                                                            {replyName}
                                                                        </span>

                                                                        {adminReply && (
                                                                            <span className="inline-flex items-center rounded-full border border-blue-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-800 sm:text-[11px]">
                                                                                Admin
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        {reply.createdAt && (
                                                                            <span className="text-[11px] text-slate-500 sm:text-xs">
                                                                                {formatDate(
                                                                                    reply.createdAt
                                                                                )}
                                                                            </span>
                                                                        )}

                                                                        {reply.editedAt && (
                                                                            <span className="text-[11px] italic text-slate-400 sm:text-xs">
                                                                                Edited
                                                                            </span>
                                                                        )}

                                                                        {reply.isOwnReply &&
                                                                            !isEditingThisReply && (
                                                                                <div className="flex items-center gap-1">
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() =>
                                                                                            startEditingReply(
                                                                                                comment._id,
                                                                                                reply
                                                                                            )
                                                                                        }
                                                                                        title="Edit reply"
                                                                                        aria-label="Edit your reply"
                                                                                        className="rounded-md p-1 text-slate-500 transition hover:bg-blue-100 hover:text-blue-950"
                                                                                    >
                                                                                        <Pencil size={13} />
                                                                                    </button>

                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() =>
                                                                                            handleReplyDelete(
                                                                                                comment._id,
                                                                                                reply
                                                                                            )
                                                                                        }
                                                                                        disabled={
                                                                                            deletingReplyId ===
                                                                                            String(reply._id)
                                                                                        }
                                                                                        title="Delete reply"
                                                                                        aria-label="Delete your reply"
                                                                                        className="rounded-md p-1 text-slate-500 transition hover:bg-red-100 hover:text-red-600 disabled:opacity-50"
                                                                                    >
                                                                                        {deletingReplyId ===
                                                                                        String(reply._id) ? (
                                                                                            <LoaderCircle
                                                                                                size={13}
                                                                                                className="animate-spin"
                                                                                            />
                                                                                        ) : (
                                                                                            <Trash2 size={13} />
                                                                                        )}
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                    </div>
                                                                </div>

                                                                {isEditingThisReply ? (
                                                                    <form
                                                                        onSubmit={(event) =>
                                                                            handleReplyEditSubmit(
                                                                                event,
                                                                                comment._id,
                                                                                reply._id
                                                                            )
                                                                        }
                                                                        className="mt-2 space-y-2"
                                                                    >
                                                                        <textarea
                                                                            value={replyEditDraft}
                                                                            onChange={(event) =>
                                                                                setReplyEditDraft(
                                                                                    event.target.value
                                                                                )
                                                                            }
                                                                            rows={2}
                                                                            maxLength={2000}
                                                                            required
                                                                            autoFocus
                                                                            disabled={
                                                                                savingReplyEdit
                                                                            }
                                                                            className="min-h-[64px] max-h-[120px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-5 text-slate-700 outline-none focus:border-blue-950 focus:ring-2 focus:ring-blue-100"
                                                                        />

                                                                        <div className="flex flex-wrap justify-end gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={
                                                                                    cancelEditingReply
                                                                                }
                                                                                disabled={
                                                                                    savingReplyEdit
                                                                                }
                                                                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-50"
                                                                            >
                                                                                Cancel
                                                                            </button>

                                                                            <button
                                                                                type="submit"
                                                                                disabled={
                                                                                    savingReplyEdit ||
                                                                                    !replyEditDraft.trim()
                                                                                }
                                                                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
                                                                            >
                                                                                {savingReplyEdit && (
                                                                                    <LoaderCircle
                                                                                        size={13}
                                                                                        className="animate-spin"
                                                                                    />
                                                                                )}
                                                                                Save reply
                                                                            </button>
                                                                        </div>
                                                                    </form>
                                                                ) : (
                                                                    <p
                                                                        className={`mt-1 whitespace-pre-wrap break-words text-sm leading-5 sm:leading-6 ${
                                                                            adminReply
                                                                                ? "text-blue-950"
                                                                                : "text-slate-700"
                                                                        }`}
                                                                    >
                                                                        {reply.text}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                )}

                {/* See more comments */}
                {comments.length > 0 && pagination?.hasMore && (
                    <div className="mt-5 flex justify-center sm:mt-6">
                        <button
                            type="button"
                            onClick={() =>
                                loadMoreComments().catch(() => {})
                            }
                            disabled={loadingMore || loading}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-blue-950 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 sm:px-6 sm:py-3"
                        >
                            {loadingMore ? (
                                <LoaderCircle
                                    size={18}
                                    className="animate-spin"
                                />
                            ) : (
                                <Plus size={18} />
                            )}
                            {loadingMore
                                ? "Loading comments..."
                                : "See more comments"}
                        </button>
                    </div>
                )}

                {/* Bottom call to action */}
                {comments.length > 0 && (
                    <section className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:mt-8 sm:flex-row sm:items-center sm:gap-4 sm:p-6">
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
                            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900 sm:px-5 sm:py-3"
                        >
                            <Plus size={18} />
                            Make a Comment
                        </button>
                    </section>
                )}
            </div>

            {/* Create comment modal */}
            {isFormOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-4"
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
                        className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:p-7"
                    >
                        <div className="mb-4 flex items-start justify-between gap-3 sm:mb-6 sm:gap-4">
                            <div>
                                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-950 sm:h-12 sm:w-12">
                                    <MessagesSquare size={22} />
                                </div>

                                <h2
                                    id="feedback-modal-title"
                                    className="text-xl font-bold text-slate-900 sm:text-2xl"
                                >
                                    Make a Comment
                                </h2>

                                <p className="mt-2 text-sm leading-5 text-slate-500 sm:leading-6">
                                    Tell us about your experience with
                                    StudStore or suggest what we should
                                    improve.
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
                                    setCommentText(event.target.value);
                                    setFormError("");
                                }}
                                placeholder="What do you like about StudStore? What would you like us to improve?"
                                rows={3}
                                maxLength={2000}
                                required
                                autoFocus
                                disabled={submitting}
                                className="min-h-[100px] max-h-[180px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-950 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:opacity-60 sm:min-h-[168px] sm:max-h-[240px]"
                            />

                            <div className="mt-2 flex items-start justify-between gap-3">
                                <p className="text-xs leading-5 text-slate-500">
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

                            <div className="mt-4 flex flex-col-reverse gap-2 sm:mt-6 sm:flex-row sm:justify-end sm:gap-3">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    disabled={submitting}
                                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:py-3"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        submitting || !commentText.trim()
                                    }
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60 sm:py-3"
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