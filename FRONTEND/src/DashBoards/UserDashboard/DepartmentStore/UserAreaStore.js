import axios from "axios";
import { create } from "zustand";

const API_URL = "https://api.studstore.com.ng/api/v1/users";

export const useMajorAreaStore = create((set) => ({
    majorAreas: [],
    majorArea: null,
    isLoading: false,
    error: null,

    // Get all major areas or those belonging to a department
    getMajorAreas: async (departmentId) => {
        set({ isLoading: true, error: null });

        try {
            const response = await axios.get(`${API_URL}/major-areas`, {
                params: departmentId ? { departmentId } : {},
            });

            set({
                majorAreas: response.data.majorAreas,
                isLoading: false,
            });

            return response.data.majorAreas;
        } catch (error) {
            set({
                isLoading: false,
                error:
                    error.response?.data?.message ||
                    "Failed to retrieve major areas",
            });

            throw error;
        }
    },

    // Get one major area by ID
    getMajorAreaById: async (majorAreaId) => {
        set({ isLoading: true, error: null });

        try {
            const response = await axios.get(
                `${API_URL}/major-area/${majorAreaId}`
            );

            set({
                majorArea: response.data.majorArea,
                isLoading: false,
            });

            return response.data.majorArea;
        } catch (error) {
            set({
                isLoading: false,
                error:
                    error.response?.data?.message ||
                    "Failed to retrieve major area",
            });

            throw error;
        }
    },
}));