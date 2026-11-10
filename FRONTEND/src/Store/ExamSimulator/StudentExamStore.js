
import { create } from "zustand";
import axios from "axios";

const API_URL = import.meta.env.DEV
  ? "http://localhost:8000/api/v1/users"
  : "https://api.studstore.com.ng/api/v1/users";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const useStudentExamStore = create((set) => ({
  exams: [],
  currentExam: null,
  currentAttempt: null,
  questions: [],
  history: [],
  result: null,
  loading: false,
  error: null,
  successMessage: null,

  clearMessages: () =>
    set({
      error: null,
      successMessage: null,
    }),

  // Get published exams available to students
  getPublishedExams: async () => {
    set({ loading: true, error: null });

    try {
      const response = await api.get("/exams");
      const exams = response.data.exams || response.data.data || [];

      set({
        exams: Array.isArray(exams) ? exams : [],
        loading: false,
      });

      return exams;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Unable to load available exams.";

      set({ error: message, loading: false });
      return [];
    }
  },

  // Get the details of one exam
  getExamById: async (examId) => {
    set({ loading: true, error: null, currentExam: null });

    try {
      const response = await api.get("/exams");
      const exams = response.data.exams || response.data.data || [];

      const exam = Array.isArray(exams)
        ? exams.find((item) => item._id === examId)
        : null;

      if (!exam) {
        throw new Error("Exam not found or unavailable.");
      }

      set({
        currentExam: exam,
        loading: false,
      });

      return exam;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Unable to load exam details.";

      set({ error: message, loading: false });
      return null;
    }
  },

  // Start a new exam attempt
  startExamAttempt: async (examId, selectedMode = "cbt") => {
    set({ loading: true, error: null });

    try {
      const response = await api.post(`/exams/${examId}/start`, {
        selectedMode,
      });

      const data = response.data.data || response.data;
      const attempt = data.attempt || data.examAttempt || data;

      set({
        currentAttempt: attempt,
        currentExam: data.exam || null,
        questions: [],
        result: null,
        loading: false,
        successMessage: data.message || "Exam attempt started successfully.",
      });

      return attempt;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Unable to start the exam.";

      set({ error: message, loading: false });
      return null;
    }
  },

  // Load questions for an active exam attempt
  getAttemptQuestions: async (attemptId) => {
    set({ loading: true, error: null });

    try {
      const response = await api.get(
        `/exam-attempts/${attemptId}/questions`
      );

      const data = response.data.data || response.data;
      const questions = data.questions || [];

      set({
        questions: Array.isArray(questions) ? questions : [],
        currentAttempt: data.attempt || data.examAttempt || null,
        currentExam: data.exam || null,
        loading: false,
      });

      return data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Unable to load exam questions.";

      set({ error: message, loading: false });
      return null;
    }
  },

  // Save a student's answer
  saveAttemptAnswer: async ({
    attemptId,
    questionId,
    selectedOptionIndex,
    writtenAnswer,
  }) => {
    set({ error: null });

    try {
      const payload = { questionId };

      if (selectedOptionIndex !== undefined) {
        payload.selectedOptionIndex = selectedOptionIndex;
      }

      if (writtenAnswer !== undefined) {
        payload.writtenAnswer = writtenAnswer;
      }

      const response = await api.put(
        `/exam-attempts/${attemptId}/answer`,
        payload
      );

      set({
        successMessage: "Answer saved.",
      });

      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Unable to save your answer.";

      set({ error: message });
      return null;
    }
  },

  // Submit an exam attempt
  submitExamAttempt: async (attemptId) => {
    set({ loading: true, error: null });

    try {
      const response = await api.post(
        `/exam-attempts/${attemptId}/submit`
      );

      const data = response.data.data || response.data;

      set({
        currentAttempt: data.attempt || data.examAttempt || null,
        result: data.result
          ? {
              ...data.result,
              message: data.message || "",
            }
          : null,
        loading: false,
        successMessage:
          data.message || "Exam submitted successfully.",
      });

      return data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Unable to submit your exam.";

      set({ error: message, loading: false });
      return null;
    }
  },

  // Get previous exam attempts
  getExamHistory: async () => {
    set({ loading: true, error: null });

    try {
      const response = await api.get("/exam-attempts/history");
      const data = response.data.data || response.data;

      const history =
        data.history ||
        data.attempts ||
        data.examAttempts ||
        [];

      set({
        history: Array.isArray(history) ? history : [],
        loading: false,
      });

      return history;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Unable to load exam history.";

      set({ error: message, loading: false });
      return [];
    }
  },

  // Get the result and corrections for a submitted attempt
  getExamResult: async (attemptId) => {
    set({ loading: true, error: null, result: null });

    try {
      const response = await api.get(
        `/exam-attempts/${attemptId}/result`
      );

      const data = response.data.data || response.data;

      const resultData = {
        ...(data.result || {}),
        resultsReleased: data.resultsReleased ?? false,
        message: data.message || "",
        exam: data.exam || null,
        corrections: data.corrections || [],
        attempt: data.attempt || null,
      };

      set({
        result: resultData,
        currentAttempt: data.attempt || data.result || null,
        loading: false,
      });

      return resultData;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Unable to load exam results.";

      set({ error: message, loading: false });
      return null;
    }
  },

  // Reset the current exam session in the frontend
  resetExamSession: () =>
    set({
      currentExam: null,
      currentAttempt: null,
      questions: [],
      result: null,
      error: null,
      successMessage: null,
    }),
}));
