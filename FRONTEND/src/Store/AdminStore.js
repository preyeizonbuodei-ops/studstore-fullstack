import axios from "axios";
import { create } from "zustand";

const API_URL = import.meta.env.DEV
    ? "http://localhost:8000/api/v1/admin"
    : "https://api.studstore.com.ng/api/v1/admin";

axios.defaults.withCredentials = true;

export const AdminRegister = create((set) => ({
    admin: null,
    isLoading: false,
    isAuthenticated: false,
    isCheckingAuth: true,
    error: null,

    pastQuestionPapers: [],
    selectedPastQuestionPaper: null,
    isPastQuestionsLoading: false,
    pastQuestionsError: null,
    // =========================
    // ADMIN REGISTER
    // =========================
    register: async (
        username,
        email,
        password,
        confirmPassword,
        adminKey
    ) => {
        set({
            isLoading: true,
            error: null
        });

        console.log("Sending registration request...");

        try {
            const response = await axios.post(`${API_URL}/register`, {
                username,
                email,
                password,
                confirmPassword,
                adminKey
            });

            set({
                admin: response.data.admin,
                isAuthenticated: false,
                isLoading: false
            });

            return response.data;

        } catch (error) {
            console.log(error);

            set({
                isLoading: false,
                error:
                    error.response?.data?.message ||
                    "Registration failed try again"
            });

            throw error;
        }
    },


    // =========================
    // CHECK ADMIN AUTH
    // =========================
    AdminCheckAuth: async () => {
    try {
        const response = await axios.get(
            `${API_URL}/admin-check-auth`
        );

        set({
            admin: response.data.admin,
            isAuthenticated: true,
            isCheckingAuth: false
        });

        return response.data;

        } catch (error) {

            try {
                await axios.post(`${API_URL}/admin-refresh-token`);

                const response = await axios.get(
                    `${API_URL}/admin-check-auth`
                );

                set({
                    admin: response.data.admin,
                    isAuthenticated: true,
                    isCheckingAuth: false
                });

                return response.data;

            } catch (error) {
                set({
                    admin: null,
                    isAuthenticated: false,
                    isCheckingAuth: false
                });

                return null;
            }

        }
    },


    // =========================
    // VERIFY ADMIN EMAIL
    // =========================
    verifyEmailSent: async (email, sentCode) => {
        try {
            const response = await axios.patch(
                `${API_URL}/admin-verify-email`,
                {
                    email,
                    sentCode
                }
            );

            const data = response.data;

            set({
                admin: data.admin,
                isAuthenticated: false
            });

            console.log("Verified admin:", data.admin);

            return data;

        } catch (error) {
            console.log("VERIFY ERROR:", error);

            throw error;
        }
    },


    // =========================
    // ADMIN LOGIN
    // =========================
    
   // =========================
// ADMIN LOGIN
// =========================
login: async (email, password, adminKey) => {
    set({
        isLoading: true,
        error: null,
    });

    try {
        const response = await axios.post(
            `${API_URL}/login`,
            {
                email,
                password,
                adminKey,
            },
            {
                withCredentials: true,
            }
        );

        set({
            admin: response.data.admin,
            isAuthenticated: true,
            isLoading: false,
            error: null,
        });

        return response.data;
            } catch (error) {
                console.error(
                    "Admin login error:",
                    error.response?.data || error.message
                );

                set({
                    admin: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error:
                        error.response?.data?.message ||
                        "Error logging in",
                });

                throw error;
            }
        },



    // =========================
    // ADMIN LOGOUT
    // =========================
    Logout: async () => {
        try {
            const response = await axios.post(
                `${API_URL}/logout`
            );

            set({
                admin: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
            });

            console.log("Logged Out Successfully");

            return response.data;

        } catch (error) {
            console.log(
                "Logout error:",
                error.response?.data
            );

            throw error;
        }
    },

    // =====================================
// PAST QUESTIONS LIBRARY - ADMIN
// =====================================

// CREATE PAST QUESTION PDF
CreatePastQuestionPaper: async (paperData) => {
    set({
        isPastQuestionsLoading: true,
        pastQuestionsError: null,
    });

    try {
        const response = await axios.post(
            `${API_URL}/past-questions`,
            paperData
        );

        set((state) => ({
            pastQuestionPapers: [
                response.data.paper,
                ...state.pastQuestionPapers,
            ],
            isPastQuestionsLoading: false,
        }));

        return response.data;
    } catch (error) {
        set({
            isPastQuestionsLoading: false,
            pastQuestionsError:
                error.response?.data?.message ||
                "Failed to create past-question PDF",
        });

        throw error;
    }
},

// GET ALL PAST QUESTION PDFs
GetPastQuestionPapers: async () => {
    set({
        isPastQuestionsLoading: true,
        pastQuestionsError: null,
    });

    try {
        const response = await axios.get(
            `${API_URL}/past-questions`
        );

        set({
            pastQuestionPapers: response.data.papers || [],
            isPastQuestionsLoading: false,
        });

        return response.data;
    } catch (error) {
        set({
            isPastQuestionsLoading: false,
            pastQuestionsError:
                error.response?.data?.message ||
                "Failed to fetch past-question PDFs",
        });

        throw error;
    }
},

// GET ONE PAST QUESTION PDF
GetPastQuestionPaperById: async (paperId) => {
    set({
        isPastQuestionsLoading: true,
        pastQuestionsError: null,
    });

    try {
        const response = await axios.get(
            `${API_URL}/past-questions/${paperId}`
        );

        set({
            selectedPastQuestionPaper: response.data.paper,
            isPastQuestionsLoading: false,
        });

        return response.data;
    } catch (error) {
        set({
            isPastQuestionsLoading: false,
            pastQuestionsError:
                error.response?.data?.message ||
                "Failed to fetch past-question PDF",
        });

        throw error;
    }
},

// UPDATE PAST QUESTION PDF DETAILS
UpdatePastQuestionPaper: async (paperId, paperData) => {
    set({
        isPastQuestionsLoading: true,
        pastQuestionsError: null,
    });

    try {
        const response = await axios.patch(
            `${API_URL}/past-questions/${paperId}`,
            paperData
        );

        set((state) => ({
            pastQuestionPapers: state.pastQuestionPapers.map(
                (paper) =>
                    paper._id === paperId
                        ? response.data.paper
                        : paper
            ),
            selectedPastQuestionPaper: response.data.paper,
            isPastQuestionsLoading: false,
        }));

        return response.data;
    } catch (error) {
        set({
            isPastQuestionsLoading: false,
            pastQuestionsError:
                error.response?.data?.message ||
                "Failed to update past-question PDF",
        });

        throw error;
    }
},

// PUBLISH, UNPUBLISH OR ARCHIVE
UpdatePastQuestionPaperStatus: async (paperId, status) => {
    set({
        isPastQuestionsLoading: true,
        pastQuestionsError: null,
    });

    try {
        const response = await axios.patch(
            `${API_URL}/past-questions/${paperId}/status`,
            { status }
        );

        set((state) => ({
            pastQuestionPapers: state.pastQuestionPapers.map(
                (paper) =>
                    paper._id === paperId
                        ? response.data.paper
                        : paper
            ),
            selectedPastQuestionPaper: response.data.paper,
            isPastQuestionsLoading: false,
        }));

        return response.data;
    } catch (error) {
        set({
            isPastQuestionsLoading: false,
            pastQuestionsError:
                error.response?.data?.message ||
                "Failed to update past-question PDF status",
        });

        throw error;
    }
},

// DELETE PAST QUESTION PDF
DeletePastQuestionPaper: async (paperId) => {
    set({
        isPastQuestionsLoading: true,
        pastQuestionsError: null,
    });

    try {
        const response = await axios.delete(
            `${API_URL}/past-questions/${paperId}`
        );

        set((state) => ({
            pastQuestionPapers: state.pastQuestionPapers.filter(
                (paper) => paper._id !== paperId
            ),
            selectedPastQuestionPaper:
                state.selectedPastQuestionPaper?._id === paperId
                    ? null
                    : state.selectedPastQuestionPaper,
            isPastQuestionsLoading: false,
        }));

        return response.data;
        } catch (error) {
            set({
                isPastQuestionsLoading: false,
                pastQuestionsError:
                    error.response?.data?.message ||
                    "Failed to delete past-question PDF",
            });

            throw error;
        }
    },

}));