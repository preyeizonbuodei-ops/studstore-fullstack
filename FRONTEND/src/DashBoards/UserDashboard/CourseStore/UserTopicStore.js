import axios from "axios";
import { create } from "zustand";

const API_URL =
  "https://api.studstore.com.ng/api/v1/users";

axios.defaults.withCredentials = true;

const useTopicStore = create(() => ({
  // Get topics belonging to a course
  getTopicsByCourse: async (courseId) => {
    try {
      const response = await axios.get(
        `${API_URL}/courses/${encodeURIComponent(courseId)}/topics`
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

  // Get one topic
  getTopicById: async (topicId) => {
    try {
      const response = await axios.get(
        `${API_URL}/topics/${encodeURIComponent(topicId)}`
      );

      return response.data;
    } catch (error) {
      console.error(
        "GET TOPIC BY ID ERROR:",
        error.response?.data || error
      );
      throw error;
    }
  },
}));

export default useTopicStore;