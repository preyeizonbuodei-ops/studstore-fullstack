import axios from "axios";
import { create } from "zustand";

const API_URL = "https://api.studstore.com.ng/api/v1/users";

export const useUserDepartmentStore = create((set) => ({
    departments: [],
    department: null,
    majorAreas: [],
    isLoading: false,
    error: null,

    // Get all departments
    getDepartments: async () => {
        set({ isLoading: true, error: null });

        try {
            const response = await axios.get(
                `${API_URL}/get-departments`
            );

            set({
                departments: response.data.departments,
                isLoading: false,
            });

            return response.data.departments;
        } catch (error) {
            set({
                isLoading: false,
                error:
                    error.response?.data?.message ||
                    "Failed to retrieve departments",
            });

            throw error;
        }
    },

    // Get one department by ID and its major areas
    getDepartmentById: async (departmentId) => {
        set({
            isLoading: true,
            error: null,
            department: null,
            majorAreas: [],
        });

        try {
            const response = await axios.get(
                `${API_URL}/get-departments/${departmentId}`
            );

            set({
                department: response.data.department,
                majorAreas: response.data.majorAreas,
                isLoading: false,
            });

            return response.data;
        } catch (error) {
            set({
                isLoading: false,
                error:
                    error.response?.data?.message ||
                    "Failed to retrieve department",
            });

            throw error;
        }
    },
}));