import axios from "axios";
import { create } from "zustand";

const API_URL =
    "https://api.studstore.com.ng/api/v1/admin";

axios.defaults.withCredentials = true;

const useLessonStore = create(() => ({
    // Create a lesson inside a topic
    createLesson: async (lessonData) => {
        try {
            const response = await axios.post(
                `${API_URL}/create-lesson`,
                lessonData
            );

            return response.data;
        } catch (error) {
            console.error(
                "CREATE LESSON ERROR:",
                error.response?.data || error
            );

            throw error;
        }
    },

    // Get all lessons
    getLessons: async () => {
        try {
            const response = await axios.get(
                `${API_URL}/get-lesson`
            );

            return response.data;
        } catch (error) {
            console.error(
                "GET LESSONS ERROR:",
                error.response?.data || error
            );

            throw error;
        }
    },

    // Get lessons belonging to a specific topic
    getLessonsByTopic: async (topicId) => {
        try {
            if (!topicId) {
                throw new Error("Topic ID is required.");
            }

            const response = await axios.get(
                `${API_URL}/get-lesson/${encodeURIComponent(topicId)}`
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

    // Update an existing lesson
    updateLesson: async (lessonId, lessonData) => {
        try {
            if (!lessonId) {
                throw new Error("Lesson ID is required.");
            }

            const response = await axios.patch(
                `${API_URL}/update-lesson/${encodeURIComponent(lessonId)}`,
                lessonData
            );

            return response.data;
        } catch (error) {
            console.error(
                "UPDATE LESSON ERROR:",
                error.response?.data || error
            );

            throw error;
        }
    },

    // Delete a lesson
    deleteLesson: async (lessonId) => {
        try {
            if (!lessonId) {
                throw new Error("Lesson ID is required.");
            }

            const response = await axios.delete(
                `${API_URL}/delete-lesson/${encodeURIComponent(lessonId)}`
            );

            return response.data;
        } catch (error) {
            console.error(
                "DELETE LESSON ERROR:",
                error.response?.data || error
            );

            throw error;
        }
    },
}));

export default useLessonStore;