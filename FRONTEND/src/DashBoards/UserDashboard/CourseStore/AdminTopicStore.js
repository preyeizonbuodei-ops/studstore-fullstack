
import axios from "axios";
import { create } from "zustand";

const API_URL =
  "https://studstore-fullstackstudstore-backend.onrender.com/api/v1/admin";

axios.defaults.withCredentials = true;

const useTopicStore = create(() => ({
  // Create a topic under a course
  createTopic: async (courseId, topicData) => {
    try {
      const response = await axios.post(
        `${API_URL}/course/${encodeURIComponent(courseId)}/topics`,
        {
          ...topicData,
          courseId,
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "CREATE TOPIC ERROR:",
        error.response?.data || error
      );
      throw error;
    }
  },

  // Get topics belonging to a particular course
  getTopicsByCourse: async (courseId) => {
    try {
      if (!courseId) {
        throw new Error("A course ID is required.");
      }

      const response = await axios.get(
        `${API_URL}/course/${encodeURIComponent(courseId)}/topics`
      );

      return response.data;
    } catch (error) {
      console.error(
        "GET TOPICS BY COURSE ERROR:",
        error.response?.data || error
      );
      throw error;
    }
  },

  // Update a topic
  updateTopic: async (topicId, topicData) => {
    try {
      const response = await axios.patch(
        `${API_URL}/topics/${encodeURIComponent(topicId)}`,
        topicData
      );

      return response.data;
    } catch (error) {
      console.error(
        "UPDATE TOPIC ERROR:",
        error.response?.data || error
      );
      throw error;
    }
  },

  // Delete a topic
  deleteTopic: async (topicId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/topics/${encodeURIComponent(topicId)}`
      );

      return response.data;
    } catch (error) {
      console.error(
        "DELETE TOPIC ERROR:",
        error.response?.data || error
      );
      throw error;
    }
  },
}));

export default useTopicStore;
