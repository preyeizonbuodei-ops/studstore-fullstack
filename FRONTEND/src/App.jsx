import { Route, Routes } from "react-router-dom";
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
import AdminDefault from "./DashBoards/AdminDashboard/AdminPages/AdminDefault";
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

// USER
import UserLanding from "./DashBoards/UserDashboard/UserPages/UserLanding";
import UserDashBoard from "./DashBoards/UserDashboard/UserPages/UserDashBoard";
import Courses from "./DashBoards/UserDashboard/UserPages/Courses";
import Lessons from "./DashBoards/UserDashboard/UserPages/Component/LessonPage";
import TopicsPage from "./DashBoards/UserDashboard/UserPages/Component/TopicPage";
import TopicDetails from "./DashBoards/UserDashboard/UserPages/Component/TopicIdPage";
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
    const checkAuth = useAuthStore(
        (state) => state.checkAuth
    );

    useEffect(() => {
        checkAuth();
    }, []);

    // Used to show the AI tutor only to logged-in students
    const user = useAuthStore((state) => state.user);

    const AdminCheckAuth = adminCheck(
        (state) => state.AdminCheckAuth
    );

    useEffect(() => {
        AdminCheckAuth();
    }, []);

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

                {/* ==================== DEPARTMENTS ==================== */}

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
                        <Route
                            index
                            element={<AdminDefault />}
                        />

                        <Route
                            path="departments"
                            element={<AdminDepartment />}
                        />

                        <Route
                            path="major-areas"
                            element={<AdminMajorArea />}
                        />

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

                    <Route
                        path="/admin/create-course"
                        element={<CreateCourse />}
                    />

                    <Route
                        path="/admin/create-lesson"
                        element={<CreateLessonForm />}
                    />

                    <Route
                        path="/admin/create-topic"
                        element={<CreateTopicForm />}
                    />

                    {/* Department Routes */}
                    <Route
                        path="/admin/create-department"
                        element={<CreateDepartment />}
                    />

                    {/* Create Major Area */}
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

                    {/* USER DASHBOARD LAYOUT */}
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

                        {/* COURSE LESSONS */}
                        <Route
                            path="/courses/:courseId/lesson"
                            element={<Lessons />}
                        />

                        <Route
                            path="/lessons/:lessonId/topics"
                            element={<TopicsPage />}
                        />

                        <Route
                            path="/topics/:topicId"
                            element={<TopicDetails />}
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

                        {/* LESSON TOPICS */}
                        {/* We will add this after creating Topics */}

                    </Route>

                    <Route
                        path="/departments/:departmentId"
                        element={<DepartmentDetails />}
                    />
                </Route>

            </Routes>

            {/* AI tutor: outside <Routes> so it shows on every page for logged-in students */}
            {<StudStoreAi />}
        </>
    );
}

export default App;