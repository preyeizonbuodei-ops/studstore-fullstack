import axios from "axios";
import { create } from "zustand";

const API_URL = "https://api.studstore.com.ng/api/v1/admin";

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

const useAdminCommentStore = create((set) => ({
    comments: [],
    selectedComment: null,

    loading: false,
    error: null,
    successMessage: null,

    clearMessages: () => {
        set({
            error: null,
            successMessage: null,
        });
    },

    // GET ALL STUDENT COMMENTS
    getAllComments: async () => {
        try {
            set({
                loading: true,
                error: null,
            });

            const response = await API.get("/comments");
            const data = response.data;

            if (data?.success === false) {
                throw new Error(
                    data.message ||
                    "Unable to retrieve student feedback."
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
                "Unable to retrieve student feedback."
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
                `/comments/${encodeURIComponent(id)}`
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

export default useAdminCommentStore;