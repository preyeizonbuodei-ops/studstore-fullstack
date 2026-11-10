
import axios from "axios";
import { create } from "zustand";

const API_URL = import.meta.env.DEV
    ? "http://localhost:8000/api/v1/users"
    : "https://api.studstore.com.ng/api/v1/users";

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

export const useStudentQuestionBankStore = create((set) => ({
    papers: [],
    currentPaper: null,
    questions: [],
    loading: false,
    error: null,

    clearMessages: () => {
        set({
            error: null,
        });
    },

    // Get published past-question papers available to the student
    getStudentPastQuestionPapers: async (params = {}) => {
        set({
            loading: true,
            error: null,
        });

        try {
            const response = await api.get("/question-bank/papers", {
                params,
            });

            set({
                papers: response.data.papers || [],
                loading: false,
            });

            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            const message =
                error.response?.data?.message ||
                "Unable to load past-question papers.";

            set({
                loading: false,
                error: message,
            });

            return {
                success: false,
                message,
            };
        }
    },

    // Get verified questions, answers and explanations for a paper
    getStudentPastQuestions: async (paperId) => {
        set({
            loading: true,
            error: null,
            questions: [],
            currentPaper: null,
        });

        try {
            const response = await api.get(
                `/question-bank/papers/${paperId}/questions`
            );

            set({
                currentPaper: response.data.paper || null,
                questions: response.data.questions || [],
                loading: false,
            });

            return {
                success: true,
                data: response.data,
            };
        } catch (error) {
            const message =
                error.response?.data?.message ||
                "Unable to load questions.";

            set({
                loading: false,
                error: message,
            });

            return {
                success: false,
                message,
            };
        }
    },

    // Clear the currently opened paper
    resetQuestionBankView: () => {
        set({
            currentPaper: null,
            questions: [],
            error: null,
        });
    },
}));
