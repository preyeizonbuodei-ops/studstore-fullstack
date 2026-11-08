
import axios from "axios";
import { create } from "zustand";

const API_URL = import.meta.env.DEV
  ? "http://localhost:8000/api/v1/admin"
  : "https://api.studstore.com.ng/api/v1/admin";

axios.defaults.withCredentials = true;

export const useQuestionBankStore = create((set, get) => ({
  papers: [],
  currentPaper: null,
  questions: [],
  loading: false,
  error: null,
  successMessage: null,

  clearMessages: () => {
    set({
      error: null,
      successMessage: null,
    });
  },

  // Upload a past-question paper
  uploadPastQuestionPaper: async (paperData) => {
    set({ loading: true, error: null, successMessage: null });

    try {
      const response = await axios.post(
        `${API_URL}/question-bank/papers`,
        paperData
      );

      const paper =
        response.data.paper ||
        response.data.data ||
        null;

      set((state) => ({
        papers: paper ? [paper, ...state.papers] : state.papers,
        currentPaper: paper || state.currentPaper,
        loading: false,
        successMessage:
          response.data.message || "Past-question paper uploaded successfully.",
      }));

      return { success: true, data: response.data };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to upload past-question paper.";

      set({ loading: false, error: message });

      return { success: false, message };
    }
  },

  // Retrieve past-question papers
  getPastQuestionPapers: async (params = {}) => {
    set({ loading: true, error: null });

    try {
      const response = await axios.get(
        `${API_URL}/question-bank/papers`,
        { params }
      );

      const papers =
        response.data.papers ||
        response.data.data ||
        [];

      set({ papers, loading: false });

      return { success: true, data: papers };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to load past-question papers.";

      set({ loading: false, error: message });

      return { success: false, message };
    }
  },

  // Retrieve one past-question paper
  getPastQuestionPaperById: async (paperId) => {
    set({ loading: true, error: null });

    try {
      const response = await axios.get(
        `${API_URL}/question-bank/papers/${paperId}`
      );

      const paper =
        response.data.paper ||
        response.data.data ||
        response.data;

      set({
        currentPaper: paper,
        loading: false,
      });

      return { success: true, data: paper };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to load past-question paper.";

      set({ loading: false, error: message });

      return { success: false, message };
    }
  },

  // Update a past-question paper
  updatePastQuestionPaper: async (paperId, paperData) => {
    set({ loading: true, error: null, successMessage: null });

    try {
      const response = await axios.patch(
        `${API_URL}/question-bank/papers/${paperId}`,
        paperData
      );

      set({
        loading: false,
        successMessage:
          response.data.message || "Past-question paper updated successfully.",
      });

      await get().getPastQuestionPaperById(paperId);
      await get().getPastQuestionPapers();

      return { success: true, data: response.data };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to update past-question paper.";

      set({ loading: false, error: message });

      return { success: false, message };
    }
  },

  // Publish a past-question paper
  publishPastQuestionPaper: async (paperId) => {
    set({ loading: true, error: null, successMessage: null });

    try {
      const response = await axios.patch(
        `${API_URL}/question-bank/papers/${paperId}/publish`
      );

      set({
        loading: false,
        successMessage:
          response.data.message || "Past-question paper published successfully.",
      });

      await get().getPastQuestionPapers();

      return { success: true, data: response.data };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to publish past-question paper.";

      set({ loading: false, error: message });

      return { success: false, message };
    }
  },

  // Archive a past-question paper
  archivePastQuestionPaper: async (paperId) => {
    set({ loading: true, error: null, successMessage: null });

    try {
      const response = await axios.patch(
        `${API_URL}/question-bank/papers/${paperId}/archive`
      );

      set({
        loading: false,
        successMessage:
          response.data.message || "Past-question paper archived successfully.",
      });

      await get().getPastQuestionPapers();

      return { success: true, data: response.data };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to archive past-question paper.";

      set({ loading: false, error: message });

      return { success: false, message };
    }
  },

  // Create an individual question under a paper
  createPastQuestion: async (paperId, questionData) => {
    set({ loading: true, error: null, successMessage: null });

    try {
      const response = await axios.post(
        `${API_URL}/question-bank/papers/${paperId}/questions`,
        questionData
      );

      set({
        loading: false,
        successMessage:
          response.data.message || "Question created successfully.",
      });

      await get().getPastQuestionsByPaper(paperId);

      return { success: true, data: response.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to create question.";

      set({ loading: false, error: message });

      return { success: false, message };
    }
  },

  // Retrieve questions belonging to a paper
  getPastQuestionsByPaper: async (paperId, params = {}) => {
    set({ loading: true, error: null });

    try {
      const response = await axios.get(
        `${API_URL}/question-bank/papers/${paperId}/questions`,
        { params }
      );

      const questions =
        response.data.questions ||
        response.data.data ||
        [];

      set({ questions, loading: false });

      return { success: true, data: questions };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to load questions.";

      set({ loading: false, error: message });

      return { success: false, message };
    }
  },

  // Retrieve one question
  getPastQuestionById: async (questionId) => {
    set({ loading: true, error: null });

    try {
      const response = await axios.get(
        `${API_URL}/question-bank/questions/${questionId}`
      );

      const question =
        response.data.question ||
        response.data.data ||
        response.data;

      set({ loading: false });

      return { success: true, data: question };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to load question.";

      set({ loading: false, error: message });

      return { success: false, message };
    }
  },

  // Update a question
  updatePastQuestion: async (paperId, questionId, questionData) => {
    set({ loading: true, error: null, successMessage: null });

    try {
      const response = await axios.patch(
        `${API_URL}/question-bank/questions/${questionId}`,
        questionData
      );

      set({
        loading: false,
        successMessage:
          response.data.message || "Question updated successfully.",
      });

      await get().getPastQuestionsByPaper(paperId);

      return { success: true, data: response.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update question.";

      set({ loading: false, error: message });

      return { success: false, message };
    }
  },

  // Verify a question
  verifyPastQuestion: async (paperId, questionId) => {
    set({ loading: true, error: null, successMessage: null });

    try {
      const response = await axios.patch(
        `${API_URL}/question-bank/questions/${questionId}/verify`
      );

      set({
        loading: false,
        successMessage:
          response.data.message || "Question verified successfully.",
      });

      await get().getPastQuestionsByPaper(paperId);

      return { success: true, data: response.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to verify question.";

      set({ loading: false, error: message });

      return { success: false, message };
    }
  },

  // Delete a question
  deletePastQuestion: async (paperId, questionId) => {
    set({ loading: true, error: null, successMessage: null });

    try {
      const response = await axios.delete(
        `${API_URL}/question-bank/questions/${questionId}`
      );

      set({
        loading: false,
        successMessage:
          response.data.message || "Question deleted successfully.",
      });

      await get().getPastQuestionsByPaper(paperId);

      return { success: true, data: response.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to delete question.";

      set({ loading: false, error: message });

      return { success: false, message };
    }
  },

  // Add selected Question Bank questions to an exam
  addQuestionsToExam: async (examId, questionIds) => {
    set({ loading: true, error: null, successMessage: null });

    try {
      const response = await axios.post(
        `${API_URL}/exams/${examId}/question-bank`,
        { questionIds }
      );

      set({
        loading: false,
        successMessage:
          response.data.message || "Questions added to exam successfully.",
      });

      return { success: true, data: response.data };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to add questions to exam.";

      set({ loading: false, error: message });

      return { success: false, message };
    }
  },
}));
