
import axios from "axios";
import { create } from "zustand";

const API_URL = "https://api.studstore.com.ng/api/v1/admin";

export const useAdminResearchPaperStore = create((set) => ({
  loading: false,
  error: null,
  success: null,

  // Admin: Create Research Paper
  createResearchPaper: async (researchPaperData) => {
    set({ loading: true, error: null, success: null });

    try {
      const response = await axios.post(
        `${API_URL}/create-research-paper`,
        researchPaperData,
        { withCredentials: true }
      );

      set({
        loading: false,
        success: response.data.message,
      });

      return response.data;
    } catch (error) {
      set({
        loading: false,
        error:
          error.response?.data?.message ||
          "Failed to create research paper",
      });

      throw error;
    }
  },
}));
