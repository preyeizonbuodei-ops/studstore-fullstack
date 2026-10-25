import axios from "axios";
import { create } from "zustand";

const API_URL = "https://api.studstore.com.ng/api/v1/users";

axios.defaults.withCredentials = true;

const useCourseStore = create(() => ({

    // Get all courses available to the logged-in student
    getCourses: async () => {
        try {
            const response = await axios.get(
                `${API_URL}/get-courses`
            );

            console.log("USER COURSES RESPONSE:", response.data);

            return response.data;
        } catch (error) {
            console.log(
                "GET COURSES ERROR:",
                error.response?.data || error
            );

            throw error;
        }
    },


    // Get one specific course
    getCourseById: async (courseId) => {
        try {
            const response = await axios.get(
                `${API_URL}/courses/${courseId}`
            );

            console.log(
                "SELECTED COURSE RESPONSE:",
                response.data
            );

            return response.data;
        } catch (error) {
            console.log(
                "GET COURSE BY ID ERROR:",
                error.response?.data || error
            );

            throw error;
        }
    }

}));

export default useCourseStore;