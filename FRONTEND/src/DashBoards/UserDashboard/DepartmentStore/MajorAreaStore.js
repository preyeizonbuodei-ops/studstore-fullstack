import axios from "axios";
import { create } from "zustand";

const API_URL =
    "https://api.studstore.com.ng/api/v1/admin";
const DEPARTMENT_URL =
    "https://api.studstore.com.ng/api/v1/admin";

axios.defaults.withCredentials = true;

export const useAdminMajorAreaStore = create((set) => ({
    majorAreas: [],
    departments: [],
    isLoading: false,
    error: null,

    // Get departments for the admin dropdown
    getDepartments: async () => {
        set({ isLoading: true, error: null });

        try {
            const response = await axios.get(
                `${DEPARTMENT_URL}/get-department`
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

    // Create a major area
    createMajorArea: async (majorAreaData) => {
        set({ isLoading: true, error: null });

        try {
            const response = await axios.post(
                `${API_URL}/create-major-area`,
                majorAreaData
            );

            set((state) => ({
                majorAreas: [
                    ...state.majorAreas,
                    response.data.majorArea,
                ],
                isLoading: false,
            }));

            return response.data;
        } catch (error) {
            set({
                isLoading: false,
                error:
                    error.response?.data?.message ||
                    "Failed to create major area",
            });

            throw error;
        }
    },

    // Get major areas, optionally filtered by department
    getMajorAreas: async (departmentId) => {
        set({ isLoading: true, error: null });

        try {
            const response = await axios.get(
                `${API_URL}/get-major-area`,
                {
                    params: departmentId ? { departmentId } : {},
                    withCredentials: true,
                }
            );

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

    // Update a major area
    updateMajorArea: async (majorAreaId, majorAreaData) => {
        set({ isLoading: true, error: null });

        try {
            const response = await axios.patch(
                `${API_URL}/update-major-area/${majorAreaId}`,
                majorAreaData
            );

            const updatedMajorArea = response.data.majorArea;

            set((state) => ({
                majorAreas: state.majorAreas.map((majorArea) =>
                    majorArea._id === majorAreaId
                        ? updatedMajorArea
                        : majorArea
                ),
                isLoading: false,
            }));

            return response.data;
        } catch (error) {
            set({
                isLoading: false,
                error:
                    error.response?.data?.message ||
                    "Failed to update major area",
            });

            throw error;
        }
    },

    // Delete a major area
    deleteMajorArea: async (majorAreaId) => {
        set({ isLoading: true, error: null });

        try {
            const response = await axios.delete(
                `${API_URL}/delete-major-area/${majorAreaId}`
            );

            set((state) => ({
                majorAreas: state.majorAreas.filter(
                    (majorArea) => majorArea._id !== majorAreaId
                ),
                isLoading: false,
            }));

            return response.data;
        } catch (error) {
            set({
                isLoading: false,
                error:
                    error.response?.data?.message ||
                    "Failed to delete major area",
            });

            throw error;
        }
    },
}));