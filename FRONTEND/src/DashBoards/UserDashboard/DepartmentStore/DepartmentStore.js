
import axios from "axios";
import { create } from "zustand";

const API_URL =
  "https://api.studstore.com.ng/api/v1/admin";

axios.defaults.withCredentials = true;

export const useDepartmentStore = create((set) => ({
  departments: [],
  department: null,
  isLoading: false,
  error: null,

  createDepartment: async (departmentData) => {
    set({ isLoading: true, error: null });

    try {
      const response = await axios.post(
        `${API_URL}/create-department`,
        departmentData
      );

      set((state) => ({
        departments: [
          ...state.departments,
          response.data.department,
        ],
        isLoading: false,
      }));

      return response.data;
    } catch (error) {
      set({
        isLoading: false,
        error:
          error.response?.data?.message ||
          "Failed to create department",
      });

      throw error;
    }
  },

  getDepartments: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await axios.get(
        `${API_URL}/get-department`
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
          "Failed to fetch departments",
      });

      throw error;
    }
  },

  getDepartmentById: async (departmentId) => {
    set({
      isLoading: true,
      error: null,
      department: null,
    });

    try {
      const response = await axios.get(
        `${API_URL}/department/${departmentId}`
      );

      set({
        department: response.data.department,
        isLoading: false,
      });

      return response.data.department;
    } catch (error) {
      set({
        isLoading: false,
        error:
          error.response?.data?.message ||
          "Failed to fetch department",
      });

      throw error;
    }
  },

  // UPDATE DEPARTMENT
  updateDepartment: async (departmentId, departmentData) => {
    set({ isLoading: true, error: null });

    try {
      const response = await axios.patch(
        `${API_URL}/update-department/${departmentId}`,
        departmentData
      );

      const updatedDepartment = response.data.department;

      set((state) => ({
        departments: state.departments.map((department) =>
          department._id === departmentId
            ? { ...department, ...updatedDepartment }
            : department
        ),
        department:
          state.department?._id === departmentId
            ? updatedDepartment
            : state.department,
        isLoading: false,
      }));

      return response.data;
    } catch (error) {
      set({
        isLoading: false,
        error:
          error.response?.data?.message ||
          "Failed to update department",
      });

      throw error;
    }
  },

  // DELETE DEPARTMENT
  deleteDepartment: async (departmentId) => {
    set({ isLoading: true, error: null });

    try {
      const response = await axios.delete(
        `${API_URL}/delete-department/${departmentId}`
      );

      set((state) => ({
        departments: state.departments.filter(
          (department) => department._id !== departmentId
        ),
        department:
          state.department?._id === departmentId
            ? null
            : state.department,
        isLoading: false,
      }));

      return response.data;
    } catch (error) {
      set({
        isLoading: false,
        error:
          error.response?.data?.message ||
          "Failed to delete department",
      });

      throw error;
    }
  },
}));
