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

const getErrorMessage = (error, fallback) =>
    error?.response?.data?.message ||
    error?.message ||
    fallback;

const useStudentCommentStore = create((set, get) => ({
    comments: [],
    selectedComment: null,

    loading: false,
    error: null,
    successMessage: null,

    // Clear feedback messages.
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

            if (
                typeof comment !== "string" ||
                !comment.trim()
            ) {
                throw new Error(
                    "Please enter your feedback."
                );
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
                        ...state.comments,
                    ],
                    selectedComment: data.comment,
                }));
            }

            set({
                successMessage:
                    data.message ||
                    "Your feedback was submitted successfully.",
            });

            return data;
        } catch (error) {
            const message = getErrorMessage(
                error,
                "Unable to submit your feedback."
            );

            set({ error: message });

            throw error;
        } finally {
            set({ loading: false });
        }
    },

    // GET ALL COMMENTS
    getAllComments: async () => {
        try {
            set({
                loading: true,
                error: null,
            });

            const response = await API.get("/all-comment");
            const data = response.data;

            if (data?.success === false) {
                throw new Error(
                    data.message ||
                    "Unable to retrieve comments."
                );
            }

            const comments = Array.isArray(data.comments)
                ? data.comments
                : [];

            set({ comments });

            return comments;
        } catch (error) {
            const message = getErrorMessage(
                error,
                "Unable to retrieve comments."
            );

            set({ error: message });

            throw error;
        } finally {
            set({ loading: false });
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

            if (data?.success === false) {
                throw new Error(
                    data.message || "Comment not found."
                );
            }

            const comment = data.comment || data.message;

            set({ selectedComment: comment });

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
                    comments: state.comments.map((item) =>
                        String(item._id) === String(id)
                            ? updatedComment
                            : item
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
            const message = getErrorMessage(
                error,
                "Unable to update the comment."
            );

            set({ error: message });

            throw error;
        } finally {
            set({ loading: false });
        }
    },

    // DELETE COMMENT
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

            set((state) => ({
                comments: state.comments.filter(
                    (item) => String(item._id) !== String(id)
                ),

                selectedComment:
                    String(state.selectedComment?._id) ===
                    String(id)
                        ? null
                        : state.selectedComment,

                successMessage:
                    data.message ||
                    "Comment deleted successfully.",
            }));

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

export default useStudentCommentStore;