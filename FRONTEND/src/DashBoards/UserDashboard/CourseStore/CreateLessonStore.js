
import axios from "axios";
import { create } from "zustand";

const API_URL = import.meta.env.DEV
    ? "http://localhost:8000/api/v1/admin"
    : "https://api.studstore.com.ng/api/v1/admin";

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

    // ==========================================
    // ADD VIDEOS, MATERIALS AND RESOURCES
    // ==========================================

    // Add a video to an existing lesson
    addVideoToLesson: async (lessonId, videoData) => {
        try {
            if (!lessonId) {
                throw new Error("Lesson ID is required.");
            }

            const response = await axios.post(
                `${API_URL}/lesson/${encodeURIComponent(lessonId)}/videos`,
                videoData
            );

            return response.data;
        } catch (error) {
            console.error(
                "ADD VIDEO TO LESSON ERROR:",
                error.response?.data || error
            );

            throw error;
        }
    },

    // Add a material to an existing lesson
    addMaterialToLesson: async (lessonId, materialData) => {
        try {
            if (!lessonId) {
                throw new Error("Lesson ID is required.");
            }

            const response = await axios.post(
                `${API_URL}/lesson/${encodeURIComponent(lessonId)}/materials`,
                materialData
            );

            return response.data;
        } catch (error) {
            console.error(
                "ADD MATERIAL TO LESSON ERROR:",
                error.response?.data || error
            );

            throw error;
        }
    },

    // Add a resource to an existing lesson
    addResourceToLesson: async (lessonId, resourceData) => {
        try {
            if (!lessonId) {
                throw new Error("Lesson ID is required.");
            }

            const response = await axios.post(
                `${API_URL}/lesson/${encodeURIComponent(lessonId)}/resources`,
                resourceData
            );

            return response.data;
        } catch (error) {
            console.error(
                "ADD RESOURCE TO LESSON ERROR:",
                error.response?.data || error
            );

            throw error;
        }
    },

    // ==========================================
    // GET VIDEOS, MATERIALS AND RESOURCES
    // ==========================================

    // Get all videos belonging to a lesson
    getLessonVideos: async (lessonId) => {
        try {
            if (!lessonId) {
                throw new Error("Lesson ID is required.");
            }

            const response = await axios.get(
                `${API_URL}/lesson/${encodeURIComponent(lessonId)}/videos`
            );

            return response.data;
        } catch (error) {
            console.error(
                "GET LESSON VIDEOS ERROR:",
                error.response?.data || error
            );

            throw error;
        }
    },

    // Get all materials belonging to a lesson
    getLessonMaterials: async (lessonId) => {
        try {
            if (!lessonId) {
                throw new Error("Lesson ID is required.");
            }

            const response = await axios.get(
                `${API_URL}/lesson/${encodeURIComponent(lessonId)}/materials`
            );

            return response.data;
        } catch (error) {
            console.error(
                "GET LESSON MATERIALS ERROR:",
                error.response?.data || error
            );

            throw error;
        }
    },

    
    // Get all resources belonging to a lesson
    getLessonResources: async (lessonId) => {
        try {
            if (!lessonId) {
                throw new Error("Lesson ID is required.");
            }

            const response = await axios.get(
                `${API_URL}/lesson/${encodeURIComponent(lessonId)}/resources`
            );

            return response.data;
        } catch (error) {
            console.error(
                "GET LESSON RESOURCES ERROR:",
                error.response?.data || error
            );

            throw error;
        }
    }
}));

export default useLessonStore;
