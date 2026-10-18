
import axios from "axios";
import { create } from "zustand";

const API_URL =
  "https://studstore-fullstackstudstore-backend.onrender.com/api/v1/admin";

export const useAdminMajorAreaTopicStore = create((set) => ({
  majorAreaTopics: [],
  majorAreaTopic: null,
  loading: false,
  error: null,

  // Create Major Area Topic
  createMajorAreaTopic: async (topicData) => {
    set({ loading: true, error: null });

    try {
      const response = await axios.post(
        `${API_URL}/create-major-area-topic`,
        topicData,
        { withCredentials: true }
      );

      set((state) => ({
        majorAreaTopics: [
          response.data.topic,
          ...state.majorAreaTopics,
        ],
        loading: false,
      }));

      return response.data;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Failed to create topic",
        loading: false,
      });

      throw error;
    }
  },

  // Get All Major Area Topics
  getAllMajorAreaTopics: async () => {
    set({ loading: true, error: null });

    try {
      const response = await axios.get(
        `${API_URL}/get-major-area-topic`,
        { withCredentials: true }
      );

      set({
        majorAreaTopics: response.data.topics,
        loading: false,
      });

      return response.data;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Failed to get topics",
        loading: false,
      });

      throw error;
    }
  },

  // Get One Major Area Topic By ID
  getMajorAreaTopicById: async (majorTopicId) => {
    set({ loading: true, error: null });

    try {
      const response = await axios.get(
        `${API_URL}/get-major-area-topic/${majorTopicId}`,
        { withCredentials: true }
      );

      set({
        majorAreaTopic: response.data.topic,
        loading: false,
      });

      return response.data;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Failed to get topic",
        loading: false,
      });

      throw error;
    }
  },

  // Update Major Area Topic
  updateMajorAreaTopic: async (majorTopicId, topicData) => {
    set({ loading: true, error: null });

    try {
      const response = await axios.patch(
        `${API_URL}/update-major-area-topic/${majorTopicId}`,
        topicData,
        { withCredentials: true }
      );

      const updatedTopic = response.data.topic;

      set((state) => ({
        majorAreaTopics: state.majorAreaTopics.map((topic) =>
          topic._id === majorTopicId ? updatedTopic : topic
        ),
        majorAreaTopic:
          state.majorAreaTopic?._id === majorTopicId
            ? updatedTopic
            : state.majorAreaTopic,
        loading: false,
      }));

      return response.data;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Failed to update topic",
        loading: false,
      });

      throw error;
    }
  },

  // Delete Major Area Topic
  deleteMajorAreaTopic: async (majorTopicId) => {
    set({ loading: true, error: null });

    try {
      const response = await axios.delete(
        `${API_URL}/delete-major-area-topic/${majorTopicId}`,
        { withCredentials: true }
      );

      set((state) => ({
        majorAreaTopics: state.majorAreaTopics.filter(
          (topic) => topic._id !== majorTopicId
        ),
        majorAreaTopic:
          state.majorAreaTopic?._id === majorTopicId
            ? null
            : state.majorAreaTopic,
        loading: false,
      }));

      return response.data;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Failed to delete topic",
        loading: false,
      });

      throw error;
    }
  },
}));
