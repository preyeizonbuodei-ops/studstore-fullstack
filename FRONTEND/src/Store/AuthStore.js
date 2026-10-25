
import { create } from "zustand";
import axios from "axios";

const API_URL = "https://api.studstore.com.ng/api/v1/users";

const API = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

const getErrorMessage = (error, fallback) =>
    error.response?.data?.message ||
    error.message ||
    fallback;

export const useAuthStore = create((set) => ({
    user: null,
    isAuthenticated: false,
    error: null,
    isLoading: false,
    isCheckingAuth: true,

    // Register a student.
    signup: async (
        email,
        password,
        confirmPassword,
        username,
        department,
        matricNumber,
        level
    ) => {
        set({
            isLoading: true,
            error: null,
        });

        try {
            const response = await API.post("/register", {
                username,
                email,
                password,
                confirmPassword,
                department,
                level,
                matricNumber,
            });

            set({
                user: response.data.newUser || null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            });

            return response.data;
        } catch (error) {
            set({
                error: getErrorMessage(
                    error,
                    "Error registering."
                ),
                isLoading: false,
            });

            throw error;
        }
    },

    // Check authentication and refresh the access token when needed.
    checkAuth: async () => {
        set({ isCheckingAuth: true });

        try {
            const response = await API.get("/check-auth");

            set({
                user: response.data.user,
                isAuthenticated: true,
                isCheckingAuth: false,
                error: null,
            });

            return response.data;
        } catch (authError) {
            // A network error or server error is not proof that
            // the user's session is invalid.
            if (authError.response?.status !== 401) {
                set({ isCheckingAuth: false });
                return null;
            }

            try {
                // The browser sends the refresh cookie with this request.
                await API.post("/refresh-token");

                // Confirm the renewed access token works.
                const response = await API.get("/check-auth");

                set({
                    user: response.data.user,
                    isAuthenticated: true,
                    isCheckingAuth: false,
                    error: null,
                });

                return response.data;
            } catch (refreshError) {
                const status = refreshError.response?.status;

                if (status === 401 || status === 403) {
                    // The backend rejected the refresh attempt.
                    set({
                        user: null,
                        isAuthenticated: false,
                        isCheckingAuth: false,
                    });
                } else {
                    // Preserve the current local state during
                    // temporary network or server failures.
                    set({ isCheckingAuth: false });
                }

                return null;
            }
        }
    },

    // Log in a student.
    Login: async (email, password) => {
        set({
            isLoading: true,
            error: null,
        });

        try {
            const response = await API.post("/login", {
                email,
                password,
            });

            set({
                user: response.data.user,
                isAuthenticated: true,
                isLoading: false,
                isCheckingAuth: false,
                error: null,
            });

            return response.data;
        } catch (error) {
            set({
                error: getErrorMessage(
                    error,
                    "Error logging in."
                ),
                isLoading: false,
            });

            throw error;
        }
    },

    // Verify a student's email.
    verifyEmailSent: async (email, verificationCode) => {
        set({
            isLoading: true,
            error: null,
        });

        try {
            const response = await API.patch(
                "/verify-verification-code",
                {
                    email,
                    verificationCode,
                }
            );

            const data = response.data;

            set({
                user: data.user || null,
                isAuthenticated: true,
                isLoading: false,
                isCheckingAuth: false,
                error: null,
            });

            return data;
        } catch (error) {
            set({
                isLoading: false,
                error: getErrorMessage(
                    error,
                    "Email verification failed."
                ),
            });

            throw error;
        }
    },

    // Log out the current student session.
    Logout: async () => {
        set({
            isLoading: true,
            error: null,
        });

        try {
            const response = await API.post("/logout");

            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                isCheckingAuth: false,
                error: null,
            });

            return response.data;
        } catch (error) {
            set({
                isLoading: false,
                error: getErrorMessage(
                    error,
                    "Logout failed."
                ),
            });

            throw error;
        }
    },

    // Request a password-reset code.
    ForgotPassword: async (email) => {
        set({
            isLoading: true,
            error: null,
        });

        try {
            const response = await API.patch(
                "/forgot-password",
                { email }
            );

            set({
                isLoading: false,
                error: null,
            });

            return response.data;
        } catch (error) {
            set({
                isLoading: false,
                error: getErrorMessage(
                    error,
                    "Failed to request a password reset."
                ),
            });

            throw error;
        }
    },

    // Verify the password-reset code.
    VerifyForgetPasswordCode: async (providedCodeValue) => {
        set({
            isLoading: true,
            error: null,
        });

        try {
            const response = await API.patch(
                "/verify-forgot-password",
                { providedCodeValue }
            );

            set({
                isLoading: false,
                error: null,
            });

            return response.data;
        } catch (error) {
            set({
                isLoading: false,
                error: getErrorMessage(
                    error,
                    "Password-reset code verification failed."
                ),
            });

            throw error;
        }
    },

    // Reset the password.
    ResetPassword: async (password, confirmPassword) => {
        set({
            isLoading: true,
            error: null,
        });

        try {
            const response = await API.patch(
                "/reset-password",
                {
                    password,
                    confirmPassword,
                }
            );

            set({
                isLoading: false,
                error: null,
            });

            return response.data;
        } catch (error) {
            set({
                isLoading: false,
                error: getErrorMessage(
                    error,
                    "Password reset failed."
                ),
            });

            throw error;
        }
    },

    // Change the password of the logged-in student.
    ChangePassword: async (oldPassword, newPassword) => {
        set({
            isLoading: true,
            error: null,
        });

        try {
            const response = await API.patch(
                "/change-password",
                {
                    oldPassword,
                    newPassword,
                }
            );

            set({
                isLoading: false,
                error: null,
            });

            return response.data;
        } catch (error) {
            set({
                isLoading: false,
                error: getErrorMessage(
                    error,
                    "Changing the password failed."
                ),
            });

            throw error;
        }
    },
}));
