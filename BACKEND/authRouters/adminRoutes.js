const express = require("express");

const { AdminRegister, adminVerifyVerificationCode, AdminLogOut, AdminLogIn } = require("../authControllers/adminRegister");
const { ValidateAdminToken } = require('../middlewares/ValidateAdminToken');
const { AdminCheckAuth } = require("../authControllers/Admin/AdminCheckAuth");
const { authorizedAdminRoles } = require("../middlewares/RoleControl");
const { CreateLesson,  GetLessons, GetLessonsByTopic, UpdateLesson, DeleteLesson} = require("../authControllers/Admin/LessonController");
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
const { GetAdminRefreshToken } = require("../authControllers/adminRegister");
const { CreateDepartment, getDepartments, UpdateDepartment, DeleteDepartment } = require("../authControllers/Admin/DepartmentController/DepartmentController");
const { createMajorArea, getMajorAreas, getMajorAreaById, updateMajorArea, deleteMajorArea } = require("../authControllers/Admin/DepartmentController/MajorAreaController");
const { createMajorAreaTopic, getAllMajorAreaTopics, getMajorAreaTopicById, updateMajorAreaTopic, deleteMajorAreaTopic } = require("../authControllers/Admin/DepartmentController/MajorTopicController");
const { createResearchPaper } = require("../authControllers/Admin/DepartmentController/ResearchAreaController");
const { getAdminDashboardStats } = require("../authControllers/Admin/GetAdminStatController");
const { getAllUsers, updateUser, deleteUser } = require("../authControllers/register");
const { CreateLimiter, AuthLimiter } = require("../middlewares/RateLimit");
const { GetAllComments, GetOneComment, DeleteComment, AddAdminCommentReply} = require("../authControllers/commentController");

const adminRouter = express.Router();

adminRouter.get('/comments', ValidateAdminToken, authorizedAdminRoles("Admin"), GetAllComments)
adminRouter.get('/comments/:id', ValidateAdminToken, authorizedAdminRoles("Admin"), GetOneComment)
adminRouter.delete('/comments/:id', ValidateAdminToken, authorizedAdminRoles("Admin"), DeleteComment)
adminRouter.post( "/comments/:id/replies", ValidateAdminToken, authorizedAdminRoles("Admin"), AddAdminCommentReply);

adminRouter.get('/dashboard-stats', ValidateAdminToken, authorizedAdminRoles("Admin"), getAdminDashboardStats)
adminRouter.get('/get-all-users', ValidateAdminToken, authorizedAdminRoles("Admin"), getAllUsers)
adminRouter.patch('/update-user/:userId', ValidateAdminToken, authorizedAdminRoles("Admin"), updateUser)
adminRouter.delete('/delete-user/:userId', ValidateAdminToken, authorizedAdminRoles("Admin"), deleteUser)

// Admin Routes
adminRouter.post('/create-course',   ValidateAdminToken, authorizedAdminRoles("Admin"),  CreateCourse)
adminRouter.get('/get-courses', ValidateAdminToken, authorizedAdminRoles("Admin"), GetCourses)
adminRouter.patch('/update-course/:courseId', ValidateAdminToken, authorizedAdminRoles("Admin"), UpdateCourse)
adminRouter.delete('/delete-course/:courseId', ValidateAdminToken, authorizedAdminRoles("Admin"), DeleteCourse)

adminRouter.post('/create-lesson', ValidateAdminToken, authorizedAdminRoles("Admin"),  CreateLesson )
adminRouter.get('/get-lesson', ValidateAdminToken, authorizedAdminRoles("Admin"), GetLessons)
adminRouter.get('/get-lesson/:topicId', ValidateAdminToken, authorizedAdminRoles("Admin"), GetLessonsByTopic)
adminRouter.patch( "/update-lesson/:lessonId", ValidateAdminToken, authorizedAdminRoles("Admin"), UpdateLesson );
adminRouter.delete("/delete-lesson/:lessonId", ValidateAdminToken, authorizedAdminRoles("Admin"), DeleteLesson );



adminRouter.post('/course/:courseId/topics', ValidateAdminToken, authorizedAdminRoles("Admin"), CreateTopic)
adminRouter.get("/course/:courseId/topics", ValidateAdminToken, authorizedAdminRoles("Admin"), GetTopicByCourse)
adminRouter.patch("/topics/:topicId", ValidateAdminToken, authorizedAdminRoles("Admin"), UpdateTopic);
adminRouter.delete ("/topics/:topicId", ValidateAdminToken, authorizedAdminRoles("Admin"), DeleteTopic);


// Department Routes
adminRouter.post("/create-department", ValidateAdminToken, authorizedAdminRoles("Admin"), CreateLimiter, CreateDepartment)
adminRouter.get("/get-department", getDepartments)
adminRouter.patch("/update-department/:departmentId", ValidateAdminToken, authorizedAdminRoles("Admin"),  UpdateDepartment)
adminRouter.delete("/delete-department/:departmentId", ValidateAdminToken, authorizedAdminRoles("Admin"),  DeleteDepartment)

adminRouter.post("/create-major-area", ValidateAdminToken, authorizedAdminRoles("Admin"),  createMajorArea)
adminRouter.get("/get-major-area", ValidateAdminToken, authorizedAdminRoles("Admin"),  getMajorAreas)
adminRouter.get("/major-area/:majorAreaId", ValidateAdminToken, authorizedAdminRoles("Admin"),  getMajorAreaById)
adminRouter.patch("/update-major-area/:majorAreaId", ValidateAdminToken, authorizedAdminRoles("Admin"),  updateMajorArea)
adminRouter.delete("/delete-major-area/:majorAreaId", ValidateAdminToken, authorizedAdminRoles("Admin"),  deleteMajorArea)
// adminRouter.post("/major-area/:departmentId", CreateDepartment)

// Major Topic Route
adminRouter.post("/create-major-area-topic", ValidateAdminToken, authorizedAdminRoles("Admin"),  createMajorAreaTopic)
adminRouter.get("/get-major-area-topic", ValidateAdminToken, authorizedAdminRoles("Admin"),  getAllMajorAreaTopics)
adminRouter.get("/get-major-area-topic/:majorTopicId", ValidateAdminToken, authorizedAdminRoles("Admin"),  getMajorAreaTopicById)
adminRouter.patch( "/update-major-area-topic/:majorTopicId", ValidateAdminToken, authorizedAdminRoles("Admin"), updateMajorAreaTopic);
adminRouter.delete( "/delete-major-area-topic/:majorTopicId", ValidateAdminToken, authorizedAdminRoles("Admin"), deleteMajorAreaTopic);

// Research Paper route
adminRouter.post("/create-research-paper", ValidateAdminToken, authorizedAdminRoles("Admin"),  createResearchPaper)

// Admin Control Routes
adminRouter.post("/register", AuthLimiter, AdminRegister)
adminRouter.patch("/admin-verify-email",  adminVerifyVerificationCode )
adminRouter.post("/login", AuthLimiter, AdminLogIn);
adminRouter.post("/logout", ValidateAdminToken,  AdminLogOut);
adminRouter.get("/admin-check-auth", ValidateAdminToken, AdminCheckAuth)
adminRouter.post("/admin-refresh-token", GetAdminRefreshToken);
module.exports = adminRouter

