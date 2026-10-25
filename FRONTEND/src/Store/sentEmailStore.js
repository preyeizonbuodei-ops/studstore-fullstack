    

import axios from "axios";
import { create } from "zustand";

const API_URL = "https://api.studstore.com.ng/api/v1/users";

export const useContactFormStore = create((set) => ({
    loading: false,
    error: null,
    success: false,

    sendEmail: async (formData) => {
        set({ loading: true, error: null, success: false });

        try {
            const response = await axios.post(
                `${API_URL}/send-email`,
                formData,
                { withCredentials: true }
            );

            set({
                loading: false,
                success: true,
                error: null
            });

            return response.data;
        } catch (error) {
            const message =
                error.response?.data?.message ||
                "Failed to send your message. Please try again.";

            set({
                loading: false,
                error: message,
                success: false
            });

            return null;
        }
    }
}));