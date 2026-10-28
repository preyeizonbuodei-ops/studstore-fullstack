import axios from "axios";
import { create } from "zustand";

const API_URL = import.meta.env.DEV
    ? "http://localhost:8000/api/v1/users"
    : "https://api.studstore.com.ng/api/v1/users";

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

const replaceComment = (comments, updatedComment) => {
    if (!updatedComment?._id) return comments;

    return comments.map((item) =>
        String(item._id) === String(updatedComment._id)
            ? updatedComment
            : item
    );
};

const useStudentCommentStore = create((set, get) => ({
    comments: [],
    selectedComment: null,

    loading: false,
    loadingMore: false,
    error: null,
    successMessage: null,

    pagination: {
        page: 1,
        limit: PAGE_SIZE,
        total: 0,
        hasMore: false,
    },

    clearMessages: () => {
        set({
            error: null,
            successMessage: null,
        });
    },

    // CREATE COMMENT
    createComment: async (comment) => {
        try {
            set({
                loading: true,
                error: null,
                successMessage: null,
            });

            if (typeof comment !== "string" || !comment.trim()) {
                throw new Error("Please enter your feedback.");
            }

            const response = await API.post("/comment", {
                comment: comment.trim(),
            });

            const data = response.data;

            if (data?.success === false) {
                throw new Error(
                    data.message || "Unable to submit feedback."
                );
            }

            if (data.comment) {
                set((state) => ({
                    comments: [
                        data.comment,
                        ...state.comments.filter(
                            (item) =>
                                String(item._id) !==
                                String(data.comment._id)
                        ),
                    ],
                    selectedComment: data.comment,
                    pagination: {
                        ...state.pagination,
                        total: state.pagination.total + 1,
                    },
                }));
            }

            set({
                successMessage:
                    data.message ||
                    "Your feedback was submitted successfully.",
            });

            return data;
        } catch (error) {
            set({
                error: getErrorMessage(
                    error,
                    "Unable to submit your feedback."
                ),
            });

            throw error;
        } finally {
            set({ loading: false });
        }
    },

    // GET THE FIRST PAGE OF COMMENTS
    getAllComments: async () => {
        try {
            set({
                loading: true,
                loadingMore: false,
                error: null,
            });

            const response = await API.get("/all-comment", {
                params: {
                    page: 1,
                    limit: PAGE_SIZE,
                },
            });

            const data = response.data;

            if (data?.success === false) {
                throw new Error(
                    data.message || "Unable to retrieve comments."
                );
            }

            const comments = Array.isArray(data.comments)
                ? data.comments
                : [];

            set({
                comments,
                pagination: data.pagination || {
                    page: 1,
                    limit: PAGE_SIZE,
                    total: comments.length,
                    hasMore: false,
                },
            });

            return comments;
        } catch (error) {
            set({
                error: getErrorMessage(
                    error,
                    "Unable to retrieve comments."
                ),
            });

            throw error;
        } finally {
            set({ loading: false });
        }
    },

    // LOAD THE NEXT PAGE OF COMMENTS
    loadMoreComments: async () => {
        const currentState = get();

        if (
            currentState.loadingMore ||
            currentState.loading ||
            !currentState.pagination?.hasMore
        ) {
            return [];
        }

        const nextPage =
            (currentState.pagination?.page || 1) + 1;

        try {
            set({
                loadingMore: true,
                error: null,
            });

            const response = await API.get("/all-comment", {
                params: {
                    page: nextPage,
                    limit: PAGE_SIZE,
                },
            });

            const data = response.data;

            if (data?.success === false) {
                throw new Error(
                    data.message || "Unable to load more comments."
                );
            }

            const newComments = Array.isArray(data.comments)
                ? data.comments
                : [];

            set((state) => {
                const existingIds = new Set(
                    state.comments.map((item) => String(item._id))
                );

                const uniqueNewComments = newComments.filter(
                    (item) =>
                        !existingIds.has(String(item._id))
                );

                return {
                    comments: [
                        ...state.comments,
                        ...uniqueNewComments,
                    ],
                    pagination: data.pagination || {
                        page: nextPage,
                        limit: PAGE_SIZE,
                        total:
                            state.pagination.total +
                            uniqueNewComments.length,
                        hasMore: false,
                    },
                };
            });

            return newComments;
        } catch (error) {
            set({
                error: getErrorMessage(
                    error,
                    "Unable to load more comments."
                ),
            });

            throw error;
        } finally {
            set({ loadingMore: false });
        }
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
            });

            const response = await API.get(
                `/get-one-comment/${encodeURIComponent(id)}`
            );

            const data = response.data;

            if (data?.success === false || !data.comment) {
                throw new Error(
                    data.message || "Comment not found."
                );
            }

            set({
                selectedComment: data.comment,
            });

            return data.comment;
        } catch (error) {
            set({
                error: getErrorMessage(
                    error,
                    "Unable to retrieve the comment."
                ),
            });

            throw error;
        } finally {
            set({ loading: false });
        }
    },

    // UPDATE COMMENT
    updateComment: async (id, comment) => {
        try {
            if (!id) {
                throw new Error("A comment ID is required.");
            }

            if (
                typeof comment !== "string" ||
                !comment.trim()
            ) {
                throw new Error(
                    "Please enter your updated comment."
                );
            }

            set({
                loading: true,
                error: null,
                successMessage: null,
            });

            const response = await API.put(
                `/update-comment/${encodeURIComponent(id)}`,
                {
                    comment: comment.trim(),
                }
            );

            const data = response.data;

            if (data?.success === false) {
                throw new Error(
                    data.message || "Unable to update comment."
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
                        String(state.selectedComment?._id) ===
                        String(id)
                            ? updatedComment
                            : state.selectedComment,
                }));
            }

            set({
                successMessage:
                    data.message ||
                    "Comment updated successfully.",
            });

            return data;
        } catch (error) {
            set({
                error: getErrorMessage(
                    error,
                    "Unable to update the comment."
                ),
            });

            throw error;
        } finally {
            set({ loading: false });
        }
    },

    // DELETE COMMENT
    // Preserve comments that have replies.
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
                `/delete-comment/${encodeURIComponent(id)}`
            );

            const data = response.data;

            if (data?.success === false) {
                throw new Error(
                    data.message || "Unable to delete comment."
                );
            }

            set((state) => {
                const commentExists = state.comments.some(
                    (item) => String(item._id) === String(id)
                );

                const comments = data.preserved
                    ? state.comments.map((item) =>
                          String(item._id) === String(id)
                              ? {
                                    ...item,
                                    comment: "This comment was deleted.",
                                    isDeleted: true,
                                    likes: [],
                                }
                              : item
                      )
                    : state.comments.filter(
                          (item) => String(item._id) !== String(id)
                      );

                return {
                    comments,

                    selectedComment:
                        String(state.selectedComment?._id) ===
                        String(id)
                            ? data.preserved
                                ? {
                                      ...state.selectedComment,
                                      comment: "This comment was deleted.",
                                      isDeleted: true,
                                      likes: [],
                                  }
                                : null
                            : state.selectedComment,

                    pagination: {
                        ...state.pagination,
                        total: data.preserved
                            ? state.pagination.total
                            : Math.max(
                                  0,
                                  state.pagination.total -
                                      (commentExists ? 1 : 0)
                              ),
                    },

                    successMessage:
                        data.message ||
                        "Comment deleted successfully.",
                };
            });

            return data;
        } catch (error) {
            set({
                error: getErrorMessage(
                    error,
                    "Unable to delete the comment."
                ),
            });

            throw error;
        } finally {
            set({ loading: false });
        }
    },

    // LIKE OR UNLIKE A COMMENT
    toggleCommentLike: async (id) => {
        try {
            if (!id) {
                throw new Error("A comment ID is required.");
            }

            set({ error: null });

            const response = await API.post(
                `/like-comment/${encodeURIComponent(id)}`
            );

            const data = response.data;

            if (data?.success === false) {
                throw new Error(
                    data.message || "Unable to update this like."
                );
            }

            if (data.comment) {
                set((state) => ({
                    comments: replaceComment(
                        state.comments,
                        data.comment
                    ),
                    selectedComment:
                        String(state.selectedComment?._id) ===
                        String(id)
                            ? data.comment
                            : state.selectedComment,
                }));
            }

            return data;
        } catch (error) {
            set({
                error: getErrorMessage(
                    error,
                    "Unable to update this like."
                ),
            });

            throw error;
        }
    },

    // ADD A REPLY
    addCommentReply: async (id, text) => {
        try {
            if (!id) {
                throw new Error("A comment ID is required.");
            }

            if (
                typeof text !== "string" ||
                !text.trim()
            ) {
                throw new Error("Please enter your reply.");
            }

            if (text.trim().length > 2000) {
                throw new Error(
                    "Your reply cannot exceed 2,000 characters."
                );
            }

            set({ error: null });

            const response = await API.post(
                `/reply-comment/${encodeURIComponent(id)}`,
                {
                    text: text.trim(),
                }
            );

            const data = response.data;

            if (data?.success === false) {
                throw new Error(
                    data.message || "Unable to add your reply."
                );
            }

            if (data.comment) {
                set((state) => ({
                    comments: replaceComment(
                        state.comments,
                        data.comment
                    ),
                    selectedComment:
                        String(state.selectedComment?._id) ===
                        String(id)
                            ? data.comment
                            : state.selectedComment,
                }));
            }

            set({
                successMessage:
                    data.message ||
                    "Your reply was added successfully.",
            });

            return data;
        } catch (error) {
            set({
                error: getErrorMessage(
                    error,
                    "Unable to add your reply."
                ),
            });

            throw error;
        }
    },

    // EDIT AN EXISTING REPLY
    updateCommentReply: async (commentId, replyId, text) => {
        try {
            if (!commentId || !replyId) {
                throw new Error(
                    "Both the comment ID and reply ID are required."
                );
            }

            if (
                typeof text !== "string" ||
                !text.trim()
            ) {
                throw new Error("Please enter your updated reply.");
            }

            if (text.trim().length > 2000) {
                throw new Error(
                    "Your reply cannot exceed 2,000 characters."
                );
            }

            set({
                error: null,
                successMessage: null,
            });

            const response = await API.put(
                `/update-comment-reply/${encodeURIComponent(
                    commentId
                )}/${encodeURIComponent(replyId)}`,
                {
                    text: text.trim(),
                }
            );

            const data = response.data;

            if (data?.success === false || !data.comment) {
                throw new Error(
                    data.message || "Unable to update your reply."
                );
            }

            set((state) => ({
                comments: replaceComment(
                    state.comments,
                    data.comment
                ),

                selectedComment:
                    String(state.selectedComment?._id) ===
                    String(commentId)
                        ? data.comment
                        : state.selectedComment,

                successMessage:
                    data.message || "Reply updated successfully.",
            }));

            return data;
        } catch (error) {
            set({
                error: getErrorMessage(
                    error,
                    "Unable to update your reply."
                ),
            });

            throw error;
        }
    },

    // DELETE AN EXISTING REPLY
    deleteCommentReply: async (commentId, replyId) => {
        try {
            if (!commentId || !replyId) {
                throw new Error(
                    "Both the comment ID and reply ID are required."
                );
            }

            set({
                error: null,
                successMessage: null,
            });

            const response = await API.delete(
                `/delete-comment-reply/${encodeURIComponent(
                    commentId
                )}/${encodeURIComponent(replyId)}`
            );

            const data = response.data;

            if (data?.success === false || !data.comment) {
                throw new Error(
                    data.message || "Unable to delete your reply."
                );
            }

            set((state) => ({
                comments: replaceComment(
                    state.comments,
                    data.comment
                ),

                selectedComment:
                    String(state.selectedComment?._id) ===
                    String(commentId)
                        ? data.comment
                        : state.selectedComment,

                successMessage:
                    data.message || "Reply deleted successfully.",
            }));

            return data;
        } catch (error) {
            set({
                error: getErrorMessage(
                    error,
                    "Unable to delete your reply."
                ),
            });

            throw error;
        }
    },
}));

export default useStudentCommentStore;