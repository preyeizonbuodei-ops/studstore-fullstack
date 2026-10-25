import axios from "axios";
import { create } from "zustand";

const API_URL = "https://api.studstore.com.ng/api/v1/users";

export const useUserMajorAreaTopicStore = create((set) => ({
    majorAreaTopics: [],
    majorAreaTopic: null,
    loading: false,
    error: null,

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
                error: error.response?.data?.message || "Failed to get topics",
                loading: false,
            });

            throw error;
        }
    },

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
                error: error.response?.data?.message || "Failed to get topic",
                loading: false,
            });

            throw error;
        }
    },
}));