import axios from "axios";
import { create } from "zustand";

const API_URL = "https://api.studstore.com.ng/api/v1/users";

export const useResearchPaperStore = create((set) => ({
  researchPapers: [],
  researchPaper: null,
  loading: false,
  error: null,

  // Get All Research Papers
  getAllResearchPapers: async () => {
    set({ loading: true, error: null });

    try {
      const response = await axios.get(
        `${API_URL}/get-all-research-papers`,
        { withCredentials: true }
      );

      set({
        researchPapers: response.data.researchPapers,
        loading: false,
      });
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Failed to retrieve research papers",
        loading: false,
      });
    }
  },

  // Get Research Paper By ID
  getResearchPaperById: async (researchPaperId) => {
    set({ loading: true, error: null, researchPaper: null });

    try {
      const response = await axios.get(
        `${API_URL}/get-all-research/${researchPaperId}`,
        { withCredentials: true }
      );

      set({
        researchPaper: response.data.researchPaper,
        loading: false,
      });
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Failed to retrieve research paper",
        loading: false,
      });
    }
  },
}));