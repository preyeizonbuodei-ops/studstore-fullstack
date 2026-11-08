
const express = require("express");

const {
    AdminRegister,
    adminVerifyVerificationCode,
    AdminLogOut,
    AdminLogIn,
    GetAdminRefreshToken,
} = require("../authControllers/adminRegister");

const { ValidateAdminToken } = require("../middlewares/ValidateAdminToken");
const { AdminCheckAuth } = require("../authControllers/Admin/AdminCheckAuth");
const { authorizedAdminRoles } = require("../middlewares/RoleControl");

const {
    CreateLesson,
    GetLessons,
    GetLessonsByTopic,
    UpdateLesson,
    DeleteLesson,
} = require("../authControllers/Admin/LessonController");

const {
    CreateCourse,
    GetCourses,
    DeleteCourse,
    UpdateCourse,
} = require("../authControllers/Admin/CourseController");

const {
    CreateTopic,
    GetTopicByCourse,
    UpdateTopic,
    DeleteTopic,
} = require("../authControllers/CoursesUser/TopicController");

const {
    CreateDepartment,
    getDepartments,
    UpdateDepartment,
    DeleteDepartment,
} = require("../authControllers/Admin/DepartmentController/DepartmentController");

const {
    createMajorArea,
    getMajorAreas,
    getMajorAreaById,
    updateMajorArea,
    deleteMajorArea,
} = require("../authControllers/Admin/DepartmentController/MajorAreaController");

const {
    createMajorAreaTopic,
    getAllMajorAreaTopics,
    getMajorAreaTopicById,
    updateMajorAreaTopic,
    deleteMajorAreaTopic,
} = require("../authControllers/Admin/DepartmentController/MajorTopicController");

const {
    createResearchPaper,
} = require("../authControllers/Admin/DepartmentController/ResearchAreaController");

const {
    getAdminDashboardStats,
} = require("../authControllers/Admin/GetAdminStatController");

const {
    getAllUsers,
    updateUser,
    deleteUser,
} = require("../authControllers/register");

const {
    CreateLimiter,
    AuthLimiter,
} = require("../middlewares/RateLimit");

const {
    GetAllComments,
    GetOneComment,
    DeleteComment,
    AddAdminCommentReply,
} = require("../authControllers/commentController");

// Exam Simulator controllers
const {
    CreateExam,
    GetExams,
    GetExamById,
    UpdateExam,
    PublishExam,
    ArchiveExam,
    // GetPendingWrittenAttempts,
    // MarkWrittenAnswer,
} = require("../authControllers/ExamSimulator/ExamController");

const {
    CreateExamQuestion,
    GetExamQuestions,
    UpdateExamQuestion,
    DeleteExamQuestion,
    AddQuestionBankQuestionsToExam,
} = require("../authControllers/ExamSimulator/ExamQuestionController");

// Question Bank - Past Question Paper controllers
const {
    UploadPastQuestionPaper,
    GetPastQuestionPapers,
    GetPastQuestionPaperById,
    UpdatePastQuestionPaper,
    PublishPastQuestionPaper,
    ArchivePastQuestionPaper,
} = require("../modules/CourseModuels/QuestionBank/PastQuestionPaparController");

// Question Bank - Individual Question controllers
const {
    CreatePastQuestion,
    GetPastQuestionsByPaper,
    GetPastQuestionById,
    UpdatePastQuestion,
    VerifyPastQuestion,
    DeletePastQuestion,
} = require("../modules/CourseModuels/QuestionBank/PastQuestionController");


const adminRouter = express.Router();


// ==========================================
// QUESTION BANK - INDIVIDUAL QUESTIONS
// ==========================================

adminRouter.post(
    "/question-bank/papers/:paperId/questions",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    CreatePastQuestion
);

adminRouter.get(
    "/question-bank/papers/:paperId/questions",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    GetPastQuestionsByPaper
);

adminRouter.get(
    "/question-bank/questions/:questionId",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    GetPastQuestionById
);

adminRouter.patch(
    "/question-bank/questions/:questionId",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    UpdatePastQuestion
);

adminRouter.patch(
    "/question-bank/questions/:questionId/verify",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    VerifyPastQuestion
);

adminRouter.delete(
    "/question-bank/questions/:questionId",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    DeletePastQuestion
);


// ==========================================
// QUESTION BANK - PAST QUESTION PAPERS
// ==========================================

adminRouter.post(
    "/question-bank/papers",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    UploadPastQuestionPaper
);

adminRouter.get(
    "/question-bank/papers",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    GetPastQuestionPapers
);

adminRouter.get(
    "/question-bank/papers/:paperId",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    GetPastQuestionPaperById
);

adminRouter.patch(
    "/question-bank/papers/:paperId",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    UpdatePastQuestionPaper
);

adminRouter.patch(
    "/question-bank/papers/:paperId/publish",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    PublishPastQuestionPaper
);

adminRouter.patch(
    "/question-bank/papers/:paperId/archive",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    ArchivePastQuestionPaper
);


// Add selected Question Bank questions to an exam
adminRouter.post(
    "/exams/:examId/question-bank",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    AddQuestionBankQuestionsToExam
);


// ==========================================
// EXAM SIMULATOR ROUTES
// ==========================================

adminRouter.post(
    "/exams",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    CreateExam
);

adminRouter.get(
    "/exams",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    GetExams
);

// Written answers awaiting admin marking
// adminRouter.get(
//     "/exams/:examId/pending-marking",
//     ValidateAdminToken,
//     authorizedAdminRoles("Admin"),
//     GetPendingWrittenAttempts
// );

// Mark a student's written answer
// adminRouter.patch(
//     "/exam-attempts/:attemptId/questions/:questionId/mark",
//     ValidateAdminToken,
//     authorizedAdminRoles("Admin"),
//     MarkWrittenAnswer
// );

adminRouter.get(
    "/exams/:examId",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    GetExamById
);

adminRouter.patch(
    "/exams/:examId",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    UpdateExam
);

adminRouter.patch(
    "/exams/:examId/publish",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    PublishExam
);

adminRouter.patch(
    "/exams/:examId/archive",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    ArchiveExam
);


// Exam Simulator question routes
adminRouter.post(
    "/exams/:examId/questions",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    CreateExamQuestion
);

adminRouter.get(
    "/exams/:examId/questions",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    GetExamQuestions
);

adminRouter.patch(
    "/exams/:examId/questions/:questionId",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    UpdateExamQuestion
);

adminRouter.delete(
    "/exams/:examId/questions/:questionId",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    DeleteExamQuestion
);


// ==========================================
// COMMENTS
// ==========================================

adminRouter.get(
    "/comments",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    GetAllComments
);

adminRouter.get(
    "/comments/:id",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    GetOneComment
);

adminRouter.delete(
    "/comments/:id",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    DeleteComment
);

adminRouter.post(
    "/comments/:id/replies",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    AddAdminCommentReply
);


// ==========================================
// ADMIN DASHBOARD AND USER MANAGEMENT
// ==========================================

adminRouter.get(
    "/dashboard-stats",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    getAdminDashboardStats
);

adminRouter.get(
    "/get-all-users",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    getAllUsers
);

adminRouter.patch(
    "/update-user/:userId",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    updateUser
);

adminRouter.delete(
    "/delete-user/:userId",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    deleteUser
);


// ==========================================
// COURSE ROUTES
// ==========================================

adminRouter.post(
    "/create-course",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    CreateCourse
);

adminRouter.get(
    "/get-courses",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    GetCourses
);

adminRouter.patch(
    "/update-course/:courseId",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    UpdateCourse
);

adminRouter.delete(
    "/delete-course/:courseId",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    DeleteCourse
);


// ==========================================
// LESSON ROUTES
// ==========================================

adminRouter.post(
    "/create-lesson",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    CreateLesson
);

adminRouter.get(
    "/get-lesson",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    GetLessons
);

adminRouter.get(
    "/get-lesson/:topicId",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    GetLessonsByTopic
);

adminRouter.patch(
    "/update-lesson/:lessonId",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    UpdateLesson
);

adminRouter.delete(
    "/delete-lesson/:lessonId",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    DeleteLesson
);


// ==========================================
// TOPIC ROUTES
// ==========================================

adminRouter.post(
    "/course/:courseId/topics",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    CreateTopic
);

adminRouter.get(
    "/course/:courseId/topics",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    GetTopicByCourse
);

adminRouter.patch(
    "/topics/:topicId",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    UpdateTopic
);

adminRouter.delete(
    "/topics/:topicId",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    DeleteTopic
);


// ==========================================
// DEPARTMENT ROUTES
// ==========================================

adminRouter.post(
    "/create-department",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    CreateLimiter,
    CreateDepartment
);

adminRouter.get(
    "/get-department",
    getDepartments
);

adminRouter.patch(
    "/update-department/:departmentId",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    UpdateDepartment
);

adminRouter.delete(
    "/delete-department/:departmentId",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    DeleteDepartment
);


// ==========================================
// MAJOR AREA ROUTES
// ==========================================

adminRouter.post(
    "/create-major-area",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    createMajorArea
);

adminRouter.get(
    "/get-major-area",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    getMajorAreas
);

adminRouter.get(
    "/major-area/:majorAreaId",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    getMajorAreaById
);

adminRouter.patch(
    "/update-major-area/:majorAreaId",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    updateMajorArea
);

adminRouter.delete(
    "/delete-major-area/:majorAreaId",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    deleteMajorArea
);


// ==========================================
// MAJOR AREA TOPIC ROUTES
// ==========================================

adminRouter.post(
    "/create-major-area-topic",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    createMajorAreaTopic
);

adminRouter.get(
    "/get-major-area-topic",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    getAllMajorAreaTopics
);

adminRouter.get(
    "/get-major-area-topic/:majorTopicId",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    getMajorAreaTopicById
);

adminRouter.patch(
    "/update-major-area-topic/:majorTopicId",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    updateMajorAreaTopic
);

adminRouter.delete(
    "/delete-major-area-topic/:majorTopicId",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    deleteMajorAreaTopic
);


// ==========================================
// RESEARCH PAPER ROUTES
// ==========================================

adminRouter.post(
    "/create-research-paper",
    ValidateAdminToken,
    authorizedAdminRoles("Admin"),
    createResearchPaper
);


// ==========================================
// ADMIN AUTHENTICATION ROUTES
// ==========================================

adminRouter.post(
    "/register",
    AuthLimiter,
    AdminRegister
);

adminRouter.patch(
    "/admin-verify-email",
    adminVerifyVerificationCode
);

adminRouter.post(
    "/login",
    AuthLimiter,
    AdminLogIn
);

adminRouter.post(
    "/logout",
    ValidateAdminToken,
    AdminLogOut
);

adminRouter.get(
    "/admin-check-auth",
    ValidateAdminToken,
    AdminCheckAuth
);

adminRouter.post(
    "/admin-refresh-token",
    GetAdminRefreshToken
);


module.exports = adminRouter;
