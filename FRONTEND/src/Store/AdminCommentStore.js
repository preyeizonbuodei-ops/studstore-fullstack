import axios from "axios";
import { create } from "zustand";

const API_URL = import.meta.env.DEV
    ? "http://localhost:8000/api/v1/admin"
    : "https://api.studstore.com.ng/api/v1/admin";

const API = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

const PAGE_SIZE = 10;

const getErrorMessage = (error, fallback) =>
    error?.response?.data?.message ||
    error?.message ||
    fallback;

const getCommentId = (comment) =>
    String(comment?._id || "");

const replaceComment = (comments, updatedComment) => {
    if (!updatedComment?._id) return comments;

    const id = getCommentId(updatedComment);

    return comments.map((comment) =>
        getCommentId(comment) === id
            ? updatedComment
            : comment
    );
};

const useAdminCommentStore = create((set, get) => ({
    comments: [],
    selectedComment: null,

    loading: false,
    loadingMore: false,
    error: null,
    successMessage: null,

    pagination: {
        page: 0,
        limit: PAGE_SIZE,
        total: 0,
        hasMore: false,
    },

    // CLEAR SUCCESS AND ERROR MESSAGES
    clearMessages: () => {
        set({
            error: null,
            successMessage: null,
        });
    },

    // GET STUDENT COMMENTS WITH PAGINATION
    // The dashboard can request 4 comments.
    // The dedicated comments page can request 10 at a time.
    getAllComments: async ({
        page = 1,
        limit = PAGE_SIZE,
        append = false,
    } = {}) => {
        const requestedPage = Math.max(
            1,
            Number.parseInt(page, 10) || 1
        );

        const requestedLimit = Math.min(
            20,
            Math.max(1, Number.parseInt(limit, 10) || PAGE_SIZE)
        );

        try {
            set({
                loading: !append,
                loadingMore: append,
                error: null,
                successMessage: null,
            });

            const response = await API.get("/comments", {
                params: {
                    page: requestedPage,
                    limit: requestedLimit,
                },
            });

            const data = response.data;

            if (data?.success === false) {
                throw new Error(
                    data.message ||
                    "Unable to retrieve student comments."
                );
            }

            const fetchedComments = Array.isArray(data.comments)
                ? data.comments
                : [];

            const serverPagination = data.pagination || {};

            set((state) => {
                let comments = fetchedComments;

                if (append) {
                    const existingIds = new Set(
                        state.comments.map(getCommentId)
                    );

                    const uniqueNewComments = fetchedComments.filter(
                        (comment) =>
                            !existingIds.has(getCommentId(comment))
                    );

                    comments = [
                        ...state.comments,
                        ...uniqueNewComments,
                    ];
                }

                return {
                    comments,
                    pagination: {
                        page:
                            Number(serverPagination.page) ||
                            requestedPage,

                        limit:
                            Number(serverPagination.limit) ||
                            requestedLimit,

                        total: Number.isFinite(
                            Number(serverPagination.total)
                        )
                            ? Number(serverPagination.total)
                            : fetchedComments.length,

                        hasMore:
                            typeof serverPagination.hasMore === "boolean"
                                ? serverPagination.hasMore
                                : false,
                    },
                };
            });

            return fetchedComments;
        } catch (error) {
            const message = getErrorMessage(
                error,
                "Unable to retrieve student comments."
            );

            set({ error: message });

            throw error;
        } finally {
            set({
                loading: false,
                loadingMore: false,
            });
        }
    },

    // LOAD THE NEXT PAGE OF COMMENTS
    loadMoreComments: async () => {
        const { pagination, loading, loadingMore } = get();

        if (loading || loadingMore || !pagination.hasMore) {
            return [];
        }

        return get().getAllComments({
            page: pagination.page + 1,
            limit: pagination.limit,
            append: true,
        });
    },

    // GET ONE COMMENT
    getOneComment: async (id) => {
        try {
            if (!id) {
                throw new Error("A comment ID is required.");
            }

            set({
                loading: true,
                error: null,
                successMessage: null,
            });

            const response = await API.get(
                `/comments/${encodeURIComponent(id)}`
            );

            const data = response.data;

            if (data?.success === false) {
                throw new Error(
                    data.message || "Comment not found."
                );
            }

            const comment = data.comment || null;

            if (comment) {
                set((state) => ({
                    selectedComment: comment,
                    comments: replaceComment(
                        state.comments,
                        comment
                    ),
                }));
            } else {
                set({ selectedComment: null });
            }

            return comment;
        } catch (error) {
            const message = getErrorMessage(
                error,
                "Unable to retrieve the comment."
            );

            set({ error: message });

            throw error;
        } finally {
            set({ loading: false });
        }
    },

    // REPLY TO A COMMENT AS STUDSTORE ADMIN
    addAdminCommentReply: async (id, text) => {
        try {
            if (!id) {
                throw new Error("A comment ID is required.");
            }

            if (typeof text !== "string" || !text.trim()) {
                throw new Error("Please enter your reply.");
            }

            const trimmedText = text.trim();

            if (trimmedText.length > 2000) {
                throw new Error(
                    "Your reply cannot exceed 2,000 characters."
                );
            }

            set({
                error: null,
                successMessage: null,
            });

            const response = await API.post(
                `/comments/${encodeURIComponent(id)}/replies`,
                {
                    text: trimmedText,
                }
            );

            const data = response.data;

            if (data?.success === false) {
                throw new Error(
                    data.message || "Unable to send admin reply."
                );
            }

            const updatedComment = data.comment;

            if (updatedComment) {
                set((state) => ({
                    comments: replaceComment(
                        state.comments,
                        updatedComment
                    ),

                    selectedComment:
                        getCommentId(state.selectedComment) ===
                        String(id)
                            ? updatedComment
                            : state.selectedComment,

                    successMessage:
                        data.message ||
                        "Your reply was sent successfully.",
                }));
            }

            return data;
        } catch (error) {
            const message = getErrorMessage(
                error,
                "Unable to send admin reply."
            );

            set({ error: message });

            throw error;
        }
    },

    // DELETE OR MODERATE A COMMENT
    deleteComment: async (id) => {
        try {
            if (!id) {
                throw new Error("A comment ID is required.");
            }

            set({
                loading: true,
                error: null,
                successMessage: null,
            });

            const response = await API.delete(
                `/comments/${encodeURIComponent(id)}`
            );

            const data = response.data;

            if (data?.success === false) {
                throw new Error(
                    data.message || "Unable to delete comment."
                );
            }

            set((state) => {
                let comments;
                let selectedComment = state.selectedComment;
                let total = state.pagination.total;

                if (data.preserved) {
                    // Keep the comment visible as a deleted placeholder.
                    comments = state.comments.map((comment) =>
                        getCommentId(comment) === String(id)
                            ? {
                                  ...comment,
                                  comment: "This comment was deleted.",
                                  isDeleted: true,
                                  likes: [],
                              }
                            : comment
                    );

                    if (
                        getCommentId(selectedComment) === String(id)
                    ) {
                        selectedComment = {
                            ...selectedComment,
                            comment: "This comment was deleted.",
                            isDeleted: true,
                            likes: [],
                        };
                    }
                } else {
                    // Remove comments that were physically deleted.
                    comments = state.comments.filter(
                        (comment) =>
                            getCommentId(comment) !== String(id)
                    );

                    if (
                        getCommentId(selectedComment) === String(id)
                    ) {
                        selectedComment = null;
                    }

                    total = Math.max(0, total - 1);
                }

                return {
                    comments,
                    selectedComment,

                    pagination: {
                        ...state.pagination,
                        total,
                    },

                    successMessage:
                        data.message ||
                        "Comment moderated successfully.",
                };
            });

            return data;
        } catch (error) {
            const message = getErrorMessage(
                error,
                "Unable to delete the comment."
            );

            set({ error: message });

            throw error;
        } finally {
            set({ loading: false });
        }
    },
}));

export default useAdminCommentStore;