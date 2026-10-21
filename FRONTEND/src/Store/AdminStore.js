import axios from "axios";
import { create } from "zustand";

const API_URL = "https://studstore-fullstackstudstore-backend.onrender.com/api/v1/admin";

axios.defaults.withCredentials = true;

export const AdminRegister = create((set) => ({
    admin: null,
    isLoading: false,
    isAuthenticated: false,
    isCheckingAuth: true,
    error: null,

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
    }
}));