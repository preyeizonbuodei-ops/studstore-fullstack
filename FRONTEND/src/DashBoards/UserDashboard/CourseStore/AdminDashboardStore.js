
import axios from "axios";
import { create } from "zustand";

const API_URL = "https://api.studstore.com.ng/api/v1/admin";

export const useAdminDashboardStore = create((set) => ({
  stats: {
    totalUsers: 0,
    totalDepartments: 0,
    totalMajorAreas: 0,
    totalTopics: 0,
    totalMaterials: 0,
  },

  loading: false,
  error: null,

  getDashboardStats: async () => {
    set({ loading: true, error: null });

    try {
      const response = await axios.get(
        `${API_URL}/dashboard-stats`,
        { withCredentials: true }
      );

      set({
        stats: response.data.stats,
        loading: false,
        error: null,
      });
    } catch (error) {
      set({
        loading: false,
        error:
          error.response?.data?.message ||
          "Failed to load dashboard statistics",
      });
    }
  },
}));
