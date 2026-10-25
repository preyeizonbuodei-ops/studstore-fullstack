
import { Route, Routes, useLocation } from "react-router-dom";
import { useAuthStore } from "./Store/AuthStore";
import { useEffect } from "react";
import { AdminRegister as adminCheck } from "./Store/AdminStore";

import Home from "./Pages/Home";
import Navbar from "./Components/Navbar";
import About from "./Pages/About";
import Research from "./Pages/Research";
import Resources from "./Pages/Resources";
import News from "./Pages/News & Events";
import Contact from "./Pages/Contact";

import UserRegister from "./Pages/UserRegister";
import Login from "./Pages/Login";
import VerifyEmail from "./Pages/VerifyEmail";
import ChangePassword from "./Pages/ChangePassword";
import ForgetPasswordVerification from "./Pages/ForgetPassword";
import ForgetPasswordSend from "./Pages/ForgetPasswordSend";
import ResetPassword from "./Pages/ResetPassword";
import StudStoreAi from "./StudStoreAi";

// ADMIN
import AdminSidebar from "./DashBoards/AdminDashboard/AdminPages/AdminSidebar";
import AdminMainContent from "./DashBoards/AdminDashboard/AdminPages/AdminMainContent";
import AdminDepartment from "./DashBoards/AdminDashboard/AdminPages/Department";
import AdminMajorArea from "./DashBoards/AdminDashboard/AdminPages/AdminMajorArea";
import Topics from "./DashBoards/AdminDashboard/AdminPages/Topics";
import CreateCourse from "./DashBoards/AdminDashboard/AdminPageForms/CreateCourseForm";
import AdminLogin from "./Pages/AdminRegisters/AdminLogin";
import AdminRegister from "./Pages/AdminRegisters/AdminRegister";
import AdminVerifyEmail from "./Pages/AdminRegisters/AdminVerifyEmail";
import CreateLessonForm from "./DashBoards/AdminDashboard/AdminPageForms/CreateLesson";
import CreateTopicForm from "./DashBoards/AdminDashboard/AdminPageForms/CreateTopic";
import CreateDepartment from "./DashBoards/AdminDashboard/AdminPageForms/CreateDepartment";
import AdminSettings from "./DashBoards/AdminDashboard/AdminPages/AdminSettings";
import AdminEditCourse from "./DashBoards/AdminDashboard/AdminPageForms/AdminEditCourseForm";
import AdminEditTopic from "./DashBoards/AdminDashboard/AdminPageForms/AdminEditTopic";
import AdminEditLesson from "./DashBoards/AdminDashboard/AdminPageForms/AdminEditLesson";

// USER
import UserLanding from "./DashBoards/UserDashboard/UserPages/UserLanding";
import UserDashBoard from "./DashBoards/UserDashboard/UserPages/UserDashBoard";
import Courses from "./DashBoards/UserDashboard/UserPages/Courses";
import TopicPage from "./DashBoards/UserDashboard/UserPages/Component/TopicsPage";
import TopicLessonsPage from "./DashBoards/UserDashboard/UserPages/Component/TopicsLessonsPage";
import LessonDetailsPage from "./DashBoards/UserDashboard/UserPages/Component/LessonDetailsPage";
import Materials from "./DashBoards/UserDashboard/UserPages/Component/ResourcesPage";
import Profile from "./DashBoards/UserDashboard/UserPages/Component/Profile";
import Settings from "./DashBoards/UserDashboard/UserPages/Component/Settings";

import AdminCreateMajorArea from "./DashBoards/AdminDashboard/AdminPageForms/CreateMajorAreaForm";
import CreateMajorAreaTopic from "./DashBoards/AdminDashboard/AdminPageForms/MajorTopicForm";
import CreateResearchPaper from "./DashBoards/AdminDashboard/AdminPageForms/CreateResearchPaper";

import Department from "./Pages/Department";
import DepartmentDetails from "./Departments/DepartmentDetails";
import AreaDetails from "./Areas/AreaDetails";
import TopicArea from "./Areas/TopicArea";
import MajorAreaTopicDetails from "./Areas/MajorAreaTopicDetails";
import ResearchPapers from "./Components/Reserch/ResearchPapers";
import UserData from "./DashBoards/AdminDashboard/AdminPages/UsersData";

// ROUTE PROTECTION
import ProtectedRoute from "./ProtectedRoute";
import GuestRoute from "./GuestRote";
import AdminGuestRoute from "./AdminGuestRoute";
import AdminProtectedRoute from "./AdminProtectedRoute";

import "./App.css";

function App() {
    const location = useLocation();

    // Hide the floating AI tutor on admin routes.
    const isAdminPage = location.pathname.startsWith("/admin");

    const checkAuth = useAuthStore((state) => state.checkAuth);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const AdminCheckAuth = adminCheck(
        (state) => state.AdminCheckAuth
    );

    useEffect(() => {
        AdminCheckAuth();
    }, [AdminCheckAuth]);

    return (
        <>
            <Routes>
                {/* ==================== PUBLIC ==================== */}

                <Route
                    path="/"
                    element={
                        <>
                            <Navbar />
                            <Home />
                        </>
                    }
                />

                <Route
                    path="/about"
                    element={
                        <>
                            <Navbar />
                            <About />
                        </>
                    }
                />

                <Route
                    path="/department"
                    element={
                        <>
                            <Navbar />
                            <Department />
                        </>
                    }
                />

                <Route
                    path="/news"
                    element={
                        <>
                            <Navbar />
                            <News />
                        </>
                    }
                />

                <Route
                    path="/resources"
                    element={
                        <>
                            <Navbar />
                            <Resources />
                        </>
                    }
                />

                <Route
                    path="/research"
                    element={
                        <>
                            <Navbar />
                            <Research />
                        </>
                    }
                />

                <Route
                    path="/contact"
                    element={
                        <>
                            <Navbar />
                            <Contact />
                        </>
                    }
                />

                {/* ==================== GUEST ROUTES ==================== */}

                <Route element={<GuestRoute />}>
                    <Route
                        path="/register"
                        element={
                            <>
                                <Navbar />
                                <UserRegister />
                            </>
                        }
                    />

                    <Route
                        path="/login"
                        element={
                            <>
                                <Navbar />
                                <Login />
                            </>
                        }
                    />

                    <Route
                        path="/verify-email"
                        element={<VerifyEmail />}
                    />

                    <Route
                        path="/verify-forget-password"
                        element={<ForgetPasswordVerification />}
                    />

                    <Route
                        path="/forget-password"
                        element={<ForgetPasswordSend />}
                    />

                    <Route
                        path="/reset-password"
                        element={<ResetPassword />}
                    />
                </Route>

                {/* ==================== RESEARCH ==================== */}

                <Route
                    path="/research-papers"
                    element={<ResearchPapers />}
                />

                {/* ==================== ADMIN ==================== */}

                <Route element={<AdminProtectedRoute />}>
                    <Route
                        path="/admin-dashboard"
                        element={<AdminSidebar />}
                    >
                        {/* Default admin course management page */}
                        <Route
                            index
                            element={<AdminMainContent />}
                        />

                        <Route
                            path="departments"
                            element={<AdminDepartment />}
                        />

                        <Route
                            path="major-areas"
                            element={<AdminMajorArea />}
                        />

                        {/* Major Area Topics, not course topics */}
                        <Route
                            path="topics"
                            element={<Topics />}
                        />

                        <Route
                            path="users"
                            element={<UserData />}
                        />

                        <Route
                            path="settings"
                            element={<AdminSettings />}
                        />
                    </Route>

                    {/* Course management forms */}
                    <Route
                        path="/admin/create-course"
                        element={<CreateCourse />}
                    />

                    <Route
                        path="/admin/edit-course"
                        element={<AdminEditCourse />}
                    />

                    <Route
                        path="/admin/edit-lesson"
                        element={<AdminEditLesson />}
                    />

                    <Route
                        path="/admin/edit-topic"
                        element={<AdminEditTopic />}
                    />

                    <Route
                        path="/admin/create-lesson"
                        element={<CreateLessonForm />}
                    />

                    <Route
                        path="/admin/create-topic"
                        element={<CreateTopicForm />}
                    />

                    {/* Department management */}
                    <Route
                        path="/admin/create-department"
                        element={<CreateDepartment />}
                    />

                    {/* Major Area management */}
                    <Route
                        path="/admin/create-major-area"
                        element={<AdminCreateMajorArea />}
                    />

                    <Route
                        path="/admin/create-major-area-topic"
                        element={<CreateMajorAreaTopic />}
                    />

                    <Route
                        path="/admin/create-research-paper"
                        element={<CreateResearchPaper />}
                    />
                </Route>

                {/* ==================== ADMIN GUEST ==================== */}

                <Route element={<AdminGuestRoute />}>
                    <Route
                        path="/admin-register"
                        element={<AdminRegister />}
                    />

                    <Route
                        path="/admin-login"
                        element={<AdminLogin />}
                    />

                    <Route
                        path="/admin-verify-email"
                        element={<AdminVerifyEmail />}
                    />
                </Route>

                {/* ==================== STUDENT ==================== */}

                <Route element={<ProtectedRoute />}>
                    <Route element={<UserDashBoard />}>
                        <Route
                            path="/me"
                            element={<UserLanding />}
                        />

                        <Route
                            path="/me/change-password"
                            element={<ChangePassword />}
                        />

                        <Route
                            path="/me/courses"
                            element={<Courses />}
                        />

                        {/* Course → Topics */}
                        <Route
                            path="/courses/:courseId/topics"
                            element={<TopicPage />}
                        />

                        {/* Preserve existing course links */}
                        <Route
                            path="/courses/:courseId/lesson"
                            element={<TopicPage />}
                        />

                        {/* Topic → Lessons */}
                        <Route
                            path="/topics/:topicId/lessons"
                            element={<TopicLessonsPage />}
                        />

                        {/* Lesson → Notes, examples, videos and materials */}
                        <Route
                            path="/lessons/:lessonId"
                            element={<LessonDetailsPage />}
                        />

                        <Route
                            path="/me/learning-materials"
                            element={<Materials />}
                        />

                        <Route
                            path="/me/profile"
                            element={<Profile />}
                        />

                        <Route
                            path="/me/setting"
                            element={<Settings />}
                        />

                        <Route
                            path="/areas/:departmentId/:areaId"
                            element={<AreaDetails />}
                        />

                        <Route
                            path="/major-areas/:areaId"
                            element={<TopicArea />}
                        />

                        <Route
                            path="/major-area-topics/:majorTopicId"
                            element={<MajorAreaTopicDetails />}
                        />
                    </Route>

                    <Route
                        path="/departments/:departmentId"
                        element={<DepartmentDetails />}
                    />
                </Route>
            </Routes>

            {/* Floating AI tutor: hidden on admin pages */}
            {!isAdminPage && <StudStoreAi />}
        </>
    );
}

export default App;
