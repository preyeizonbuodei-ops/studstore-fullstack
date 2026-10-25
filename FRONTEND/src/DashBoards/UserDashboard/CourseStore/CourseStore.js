import { create } from "zustand";
import axios from "axios";

const API_URL = "https://api.studstore.com.ng/api/v1/admin";

axios.defaults.withCredentials = true;
const createCourseStore = create(() => ({

    addcourse: async (
        courseType,
        courseScope,
        department,
        level,
        courseTitle,
        courseCode,
        semester,
        description
    ) => {

        try {

            const response = await axios.post(
                `${API_URL}/create-course`,
                {
                    courseType,
                    courseScope,
                    department,
                    level,
                    courseTitle,
                    courseCode,
                    semester,
                    description
                }
            );

            

            return response.data;

        } catch (error) {

            console.log(
                "CREATE COURSE ERROR:",
                error.response?.data || error
            );

            throw error;
        }
    },



        getCourses: async () => {
            try {
                const response = await axios.get(
                    `${API_URL}/get-courses`
                );

                

                return response.data;

            } catch (error) {
                console.log(
                    "GET ADMIN COURSES ERROR:",
                    error.response?.data || error
                );

                throw error;
            }
        },

        updateCourse: async (courseId, courseData) => {
            try {
                const response = await axios.patch(
                    `${API_URL}/update-course/${courseId}`,
                    courseData
                );

                return response.data;
            } catch (error) {
                console.log(
                    "UPDATE COURSE ERROR:",
                    error.response?.data || error
                );
                throw error;
            }
        },

        deleteCourse: async (courseId) => {
            try {
                const response = await axios.delete(
                    `${API_URL}/delete-course/${courseId}`
                );

                return response.data;
            } catch (error) {
                console.log(
                    "DELETE COURSE ERROR:",
                    error.response?.data || error
                );
                throw error;
            }
        },
}));

export default createCourseStore;