
import axios from "axios";
import { create } from "zustand";

const API_URL = "https://api.studstore.com.ng/api/v1/admin";

const API = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

const normalizeTopicNumber = (topicData) => {
    const value =
        topicData?.topicNumber ?? topicData?.TopicNumber;

    if (value === "" || value === null || value === undefined) {
        return null;
    }

    const number = Number(value);

    return Number.isInteger(number) && number >= 1
        ? number
        : null;
};

const useTopicStore = create(() => ({
    // Create a topic under a course.
    createTopic: async (courseId, topicData) => {
        try {
            if (!courseId) {
                throw new Error("A course ID is required.");
            }

            const title = String(topicData?.title || "").trim();
            const topicNumber = normalizeTopicNumber(topicData);

            if (!title) {
                throw new Error("A topic title is required.");
            }

            if (topicNumber === null) {
                throw new Error(
                    "Enter a valid topic number greater than zero."
                );
            }

            const payload = {
                courseId,
                title,
                // Support either field name while the API contract
                // is being standardized.
                topicNumber,
                TopicNumber: topicNumber,
            };

            const response = await API.post(
                `/course/${encodeURIComponent(courseId)}/topics`,
                payload
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

    // Get topics belonging to a particular course.
    getTopicsByCourse: async (courseId) => {
        try {
            if (!courseId) {
                throw new Error("A course ID is required.");
            }

            const response = await API.get(
                `/course/${encodeURIComponent(courseId)}/topics`
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

    // Update a topic.
    updateTopic: async (topicId, topicData) => {
        try {
            if (!topicId) {
                throw new Error("A topic ID is required.");
            }

            const response = await API.patch(
                `/topics/${encodeURIComponent(topicId)}`,
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

    // Delete a topic.
    deleteTopic: async (topicId) => {
        try {
            if (!topicId) {
                throw new Error("A topic ID is required.");
            }

            const response = await API.delete(
                `/topics/${encodeURIComponent(topicId)}`
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
