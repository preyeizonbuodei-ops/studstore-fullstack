
import axios from "axios";
import { create } from "zustand";

const API_URL = "https://api.studstore.com.ng/api/v1/admin";

axios.defaults.withCredentials = true;

export const useUserManagementStore = create((set) => ({
  users: [],
  user: null,
  totalUsers: 0,
  totalStudents: 0,
  totalAdmins: 0,
  loading: false,
  error: null,

  // Get all students and admins
  getAllUsers: async () => {
    set({ loading: true, error: null });

    try {
      const response = await axios.get(
        `${API_URL}/get-all-users`
      );

      set({
        users: response.data.users || [],
        totalUsers: response.data.totalUsers || 0,
        totalStudents: response.data.totalStudents || 0,
        totalAdmins: response.data.totalAdmins || 0,
        loading: false,
      });

      return response.data.users || [];
    } catch (error) {
      set({
        loading: false,
        error:
          error.response?.data?.message ||
          "Failed to fetch users",
      });

      throw error;
    }
  },

  // Update a student's profile
  updateUser: async (userId, userData) => {
    set({ loading: true, error: null });

    try {
      const response = await axios.patch(
        `${API_URL}/update-user/${userId}`,
        userData
      );

      set((state) => ({
        users: state.users.map((user) =>
          user._id === userId &&
          user.accountType === "Student"
            ? { ...user, ...response.data.user, accountType: "Student" }
            : user
        ),
        user: response.data.user,
        loading: false,
      }));

      return response.data;
    } catch (error) {
      set({
        loading: false,
        error:
          error.response?.data?.message ||
          "Failed to update student",
      });

      throw error;
    }
  },

  // Delete a student
  deleteUser: async (userId) => {
    set({ loading: true, error: null });

    try {
      const response = await axios.delete(
        `${API_URL}/delete-user/${userId}`
      );

      set((state) => ({
        users: state.users.filter(
          (user) =>
            !(
              user._id === userId &&
              user.accountType === "Student"
            )
        ),
        totalUsers: Math.max(0, state.totalUsers - 1),
        totalStudents: Math.max(0, state.totalStudents - 1),
        user:
          state.user?._id === userId
            ? null
            : state.user,
        loading: false,
      }));

      return response.data;
    } catch (error) {
      set({
        loading: false,
        error:
          error.response?.data?.message ||
          "Failed to delete student",
      });

      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useUserManagementStore;
