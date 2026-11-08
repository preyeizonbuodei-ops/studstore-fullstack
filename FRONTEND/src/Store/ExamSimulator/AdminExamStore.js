
import axios from "axios";
import { create } from "zustand";

const API_URL = import.meta.env.DEV
  ? "http://localhost:8000/api/v1/admin"
  : "https://api.studstore.com.ng/api/v1/admin";

axios.defaults.withCredentials = true;

export const useAdminExamStore = create((set, get) => ({
  exams: [],
  currentExam: null,
  questions: [],
  pendingAttempts: [],
  loading: false,
  error: null,
  successMessage: null,

  clearMessages: () => {
    set({
      error: null,
      successMessage: null,
    });
  },

  // Create a draft exam
  createExam: async (examData) => {
    set({ loading: true, error: null, successMessage: null });

    try {
      const response = await axios.post(
        `${API_URL}/exams`,
        examData
      );

      const exam =
        response.data.exam ||
        response.data.data ||
        null;

      set((state) => ({
        exams: exam
          ? [exam, ...state.exams]
          : state.exams,
        currentExam: exam || state.currentExam,
        loading: false,
        successMessage:
          response.data.message || "Exam created successfully.",
      }));

      return { success: true, data: response.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to create exam.";

      set({ loading: false, error: message });

      return { success: false, message };
    }
  },

  // Retrieve exams
  getExams: async (params = {}) => {
    set({ loading: true, error: null });

    try {
      const response = await axios.get(`${API_URL}/exams`, {
        params,
      });

      const exams =
        response.data.exams ||
        response.data.data ||
        [];

      set({ exams, loading: false });

      return { success: true, data: exams };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to load exams.";

      set({ loading: false, error: message });

      return { success: false, message };
    }
  },

  // Retrieve one exam
  getExamById: async (examId) => {
    set({ loading: true, error: null });

    try {
      const response = await axios.get(
        `${API_URL}/exams/${examId}`
      );

      const exam =
        response.data.exam ||
        response.data.data ||
        response.data;

      set({
        currentExam: exam,
        loading: false,
      });

      return { success: true, data: exam };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to load exam.";

      set({ loading: false, error: message });

      return { success: false, message };
    }
  },

  // Update an exam
  updateExam: async (examId, examData) => {
    set({ loading: true, error: null, successMessage: null });

    try {
      const response = await axios.patch(
        `${API_URL}/exams/${examId}`,
        examData
      );

      set({
        loading: false,
        successMessage:
          response.data.message || "Exam updated successfully.",
      });

      await get().getExams();

      return { success: true, data: response.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update exam.";

      set({ loading: false, error: message });

      return { success: false, message };
    }
  },

  // Publish an exam
  publishExam: async (examId) => {
    set({ loading: true, error: null, successMessage: null });

    try {
      const response = await axios.patch(
        `${API_URL}/exams/${examId}/publish`
      );

      set({
        loading: false,
        successMessage:
          response.data.message || "Exam published successfully.",
      });

      await get().getExams();

      return { success: true, data: response.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to publish exam.";

      set({ loading: false, error: message });

      return { success: false, message };
    }
  },

  // Archive an exam
  archiveExam: async (examId) => {
    set({ loading: true, error: null, successMessage: null });

    try {
      const response = await axios.patch(
        `${API_URL}/exams/${examId}/archive`
      );

      set({
        loading: false,
        successMessage:
          response.data.message || "Exam archived successfully.",
      });

      await get().getExams();

      return { success: true, data: response.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to archive exam.";

      set({ loading: false, error: message });

      return { success: false, message };
    }
  },

  // Create a manual question
  createQuestion: async (examId, questionData) => {
    set({ loading: true, error: null, successMessage: null });

    try {
      const response = await axios.post(
        `${API_URL}/exams/${examId}/questions`,
        questionData
      );

      set({
        loading: false,
        successMessage:
          response.data.message || "Question created successfully.",
      });

      await get().getQuestions(examId);

      return { success: true, data: response.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to create question.";

      set({ loading: false, error: message });

      return { success: false, message };
    }
  },

  // Retrieve questions for an exam
  getQuestions: async (examId) => {
    set({ loading: true, error: null });

    try {
      const response = await axios.get(
        `${API_URL}/exams/${examId}/questions`
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

  // Update a question
  updateQuestion: async (examId, questionId, questionData) => {
    set({ loading: true, error: null, successMessage: null });

    try {
      const response = await axios.patch(
        `${API_URL}/exams/${examId}/questions/${questionId}`,
        questionData
      );

      set({
        loading: false,
        successMessage:
          response.data.message || "Question updated successfully.",
      });

      await get().getQuestions(examId);

      return { success: true, data: response.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to update question.";

      set({ loading: false, error: message });

      return { success: false, message };
    }
  },

  // Delete a question
  deleteQuestion: async (examId, questionId) => {
    set({ loading: true, error: null, successMessage: null });

    try {
      const response = await axios.delete(
        `${API_URL}/exams/${examId}/questions/${questionId}`
      );

      set({
        loading: false,
        successMessage:
          response.data.message || "Question deleted successfully.",
      });

      await get().getQuestions(examId);

      return { success: true, data: response.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to delete question.";

      set({ loading: false, error: message });

      return { success: false, message };
    }
  },

  // Retrieve written answers awaiting admin marking
  getPendingWrittenAttempts: async (examId) => {
    set({ loading: true, error: null });

    try {
      const response = await axios.get(
        `${API_URL}/exams/${examId}/pending-marking`
      );

      const pendingAttempts = response.data.attempts || [];

      set({ pendingAttempts, loading: false });

      return { success: true, data: pendingAttempts };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to load written answers.";

      set({ loading: false, error: message });

      return { success: false, message };
    }
  },

  // Mark a written answer
  markWrittenAnswer: async (
    attemptId,
    questionId,
    markingData
  ) => {
    set({ loading: true, error: null, successMessage: null });

    try {
      const response = await axios.patch(
        `${API_URL}/exam-attempts/${attemptId}/questions/${questionId}/mark`,
        markingData
      );

      set({
        loading: false,
        successMessage:
          response.data.message || "Answer marked successfully.",
      });

      return { success: true, data: response.data };
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to mark answer.";

      set({ loading: false, error: message });

      return { success: false, message };
    }
  },
}));
