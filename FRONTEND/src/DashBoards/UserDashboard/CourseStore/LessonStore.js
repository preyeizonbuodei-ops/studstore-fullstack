import axios from "axios";
import { create } from "zustand";

const API_URL =
  "https://studstore-fullstackstudstore-backend.onrender.com/api/v1/users";

axios.defaults.withCredentials = true;

const LessonStore = create(() => ({
  // Get lessons belonging to a topic
  getLessonsByTopic: async (topicId) => {
    try {
      const response = await axios.get(
        `${API_URL}/topics/${encodeURIComponent(topicId)}/lessons`
      );

      return response.data;
    } catch (error) {
      console.error(
        "GET LESSONS BY TOPIC ERROR:",
        error.response?.data || error
      );
      throw error;
    }
  },

  // Get one lesson and its content
  getLessonById: async (lessonId) => {
    try {
      const response = await axios.get(
        `${API_URL}/lessons/${encodeURIComponent(lessonId)}`
      );

      return response.data;
    } catch (error) {
      console.error(
        "GET LESSON BY ID ERROR:",
        error.response?.data || error
      );
      throw error;
    }
  },
}));

export default LessonStore;