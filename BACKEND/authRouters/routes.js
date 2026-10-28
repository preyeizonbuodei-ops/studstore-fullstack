const express = require("express");

const { Register, Login, Logout, verifyVerificationCode, ChangePassword, ForgotPasswordEmail, VerifyForgotPasswordCode, ResetPassword, getRefreshToken } = require("../authControllers/register");
const { ValidateToken } = require("../middlewares/validateToken");
const { CreateComment, GetAllComments, GetOneComment, UpdateComment, DeleteComment, ToggleCommentLike, AddCommentReply, UpdateCommentReply, DeleteCommentReply} = require("../authControllers/commentController");
const { ConnectNews } = require("../authControllers/NewsController");
const { GetCourses, GetCourseById } = require("../authControllers/CoursesUser/GetCourses");
const { GetCurrentUser } = require("../authControllers/GetCurrentUser");
const { Getlesson, GetLessonById, } = require("../authControllers/CoursesUser/GetLesson");
const { checkAuth } = require("../authControllers/CheckAuth");
const { authorizedUserRoles} = require("../middlewares/RoleControl");
const {
  GetTopicsByCourse,
  GetTopicById,
} = require("../authControllers/CoursesUser/TopicContent");
const { SaveMaterial, GetSavedMaterials, DeleteSavedMaterial } = require("../authControllers/CoursesUser/SaveMaterialController");
const { getDepartments, getDepartmentById } = require("../authControllers/Admin/DepartmentController/DepartmentController");
const { getMajorAreas, getMajorAreaById } = require("../authControllers/Admin/DepartmentController/MajorAreaController");
const { getAllMajorAreaTopics, getMajorAreaTopicById } = require("../authControllers/Admin/DepartmentController/MajorTopicController");
const { ContactFormController } = require("../authControllers/ContactFormController");
const { getAllResearchPapers, getResearchPaperById } = require("../authControllers/Admin/DepartmentController/ResearchAreaController");
const { AuthLimiter } = require("../middlewares/RateLimit");
const { askQuestion, getConversations, getConversation } = require("../authControllers/StudStoreAi");



const router = express.Router();

// StudStore Ai Route
router.post("/ask-ai", ValidateToken, askQuestion);
router.get("/conversations", ValidateToken, getConversations);
router.get("/conversations/:id", ValidateToken, getConversation);

// user Control Routes
router.get("/check-auth", ValidateToken, checkAuth)
router.get("/me", ValidateToken, authorizedUserRoles("Student"), GetCurrentUser);
router.post("/register", AuthLimiter, Register);
router.post("/login", AuthLimiter, Login);
router.post("/logout", ValidateToken, Logout);
router.post("/refresh-token", getRefreshToken);

// Courses Routes
router.get( "/get-courses", ValidateToken, authorizedUserRoles("Student"), GetCourses);

router.get( "/courses/:courseId", ValidateToken, authorizedUserRoles("Student"),  GetCourseById);

router.get( "/courses/:courseId/lesson", ValidateToken, authorizedUserRoles("Student"), Getlesson);
router.get(
  "/topics/:topicId/lessons",
  ValidateToken,
  authorizedUserRoles("Student"),
  Getlesson
);

router.get(
  "/courses/:courseId/topics",
  ValidateToken,
  authorizedUserRoles("Student"),
  GetTopicsByCourse
);
router.get(
    "/lessons/:lessonId",
    ValidateToken,
    authorizedUserRoles("Student"),
    GetLessonById
);
router.get("/topics/:topicId", ValidateToken, authorizedUserRoles("Student"), GetTopicById)
router.post("/save-material", ValidateToken, authorizedUserRoles("Student"), SaveMaterial)
router.get("/saved-material", ValidateToken, authorizedUserRoles("Student"), GetSavedMaterials)
router.delete("/saved-material/:materialId", ValidateToken, authorizedUserRoles("Student"), DeleteSavedMaterial)

// DepartmentsRoute
router.get("/get-departments", getDepartments);
router.get("/get-departments/:departmentId", ValidateToken, authorizedUserRoles("Student"), getDepartmentById);
router.get("/get-major-area", ValidateToken, authorizedUserRoles("Student"), getMajorAreas);
router.get("/major-area/:majorAreaId", ValidateToken, authorizedUserRoles("Student"), getMajorAreaById);

// Major Area Topic Route
router.get("/get-major-area-topic", ValidateToken, authorizedUserRoles("Student"), getAllMajorAreaTopics);
router.get("/get-major-area-topic/:majorTopicId", ValidateToken, authorizedUserRoles("Student"), getMajorAreaTopicById);

// Email Routes
router.patch("/verify-verification-code", AuthLimiter, verifyVerificationCode);
router.patch("/change-password", AuthLimiter, ValidateToken, ChangePassword);
router.patch("/forgot-password", AuthLimiter, ForgotPasswordEmail);
router.patch("/verify-forgot-password", AuthLimiter, VerifyForgotPasswordCode);
router.patch("/reset-password", ResetPassword);

// Research Papers route
router.get("/get-all-research-papers", ValidateToken, authorizedUserRoles("Student"), getAllResearchPapers);
router.get("/get-all-research/:researchPaper", ValidateToken, authorizedUserRoles("Student"), getResearchPaperById);
// comment routes

router.post( "/comment",ValidateToken, authorizedUserRoles("Student"), CreateComment);
router.get( "/all-comment", ValidateToken, authorizedUserRoles("Student"), GetAllComments);
router.get( "/get-one-comment/:id", ValidateToken, authorizedUserRoles("Student"), GetOneComment);
router.put("/update-comment/:id", ValidateToken, authorizedUserRoles("Student"), UpdateComment);
router.delete( "/delete-comment/:id", ValidateToken, authorizedUserRoles("Student"), DeleteComment);
router.post( "/like-comment/:id", ValidateToken, authorizedUserRoles("Student"), ToggleCommentLike );
router.post( "/reply-comment/:id", ValidateToken, authorizedUserRoles("Student"), AddCommentReply);
router.put( "/update-comment-reply/:id/:replyId", ValidateToken, authorizedUserRoles("Student"), UpdateCommentReply);
router.delete( "/delete-comment-reply/:id/:replyId", ValidateToken, authorizedUserRoles("Student"), DeleteCommentReply);

router.get("/get-news", ConnectNews);
router.post("/send-email", ValidateToken, authorizedUserRoles("Student"), ContactFormController);

module.exports = router;