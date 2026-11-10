
const mongoose = require("mongoose");

const User = require("../../modules/registerSchema");
const Course = require("../../modules/CourseModuels/Courses");

const PastQuestionPaper = require("../../modules/CourseModuels/QuestionBank/PastQuestionPapar");
const PastQuestion = require("../../modules/CourseModuels/QuestionBank/PastQuestions");


// Get the courses a student is permitted to access.
const getStudentEligibleCourses = async (studentId) => {
    const student = await User.findById(studentId)
        .select("level department role")
        .lean();

    if (!student) {
        return {
            student: null,
            courses: [],
        };
    }

    const courses = await Course.find({
        courseType: "semester",
        level: student.level,
        $or: [
            {
                courseScope: "shared",
            },
            {
                courseScope: "department",
                department: student.department,
            },
        ],
    })
        .select("_id courseCode courseTitle courseScope department level semester")
        .lean();

    return {
        student,
        courses,
    };
};


// Verify that a student can access a particular paper.
const getAccessiblePaper = async (studentId, paperId) => {
    const paper = await PastQuestionPaper.findOne({
        _id: paperId,
        status: "published",
    })
        .populate("courseId", "courseCode courseTitle courseType courseScope department level semester")
        .lean();

    if (!paper || !paper.courseId) {
        return null;
    }

    const { courses } = await getStudentEligibleCourses(studentId);

    const hasAccess = courses.some(
        (course) =>
            course._id.toString() === paper.courseId._id.toString()
    );

    if (!hasAccess) {
        return null;
    }

    return paper;
};


// List published past-question papers available to a student.
exports.GetStudentPastQuestionPapers = async (req, res) => {
    try {
        if (!req.user || !mongoose.isValidObjectId(req.user.id)) {
            return res.status(401).json({
                success: false,
                message: "Student authentication is invalid.",
            });
        }

        const {
            courseId,
            academicYear,
            semester,
            page = 1,
            limit = 20,
        } = req.query;

        const { student, courses } = await getStudentEligibleCourses(
            req.user.id
        );

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found.",
            });
        }

        const eligibleCourseIds = courses.map((course) => course._id);

        const filter = {
            status: "published",
            courseId: {
                $in: eligibleCourseIds,
            },
        };

        if (courseId) {
            if (!mongoose.isValidObjectId(courseId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid course ID.",
                });
            }

            if (
                !eligibleCourseIds.some(
                    (id) => id.toString() === courseId
                )
            ) {
                return res.status(403).json({
                    success: false,
                    message: "You do not have access to this course.",
                });
            }

            filter.courseId = courseId;
        }

        if (academicYear) {
            filter.academicYear = academicYear;
        }

        if (semester) {
            if (!["first", "second"].includes(semester)) {
                return res.status(400).json({
                    success: false,
                    message: "Semester must be first or second.",
                });
            }

            filter.semester = semester;
        }

        const pageNumber = Math.max(1, parseInt(page, 10) || 1);
        const pageLimit = Math.min(
            50,
            Math.max(1, parseInt(limit, 10) || 20)
        );

        const skip = (pageNumber - 1) * pageLimit;

        const [papers, total] = await Promise.all([
            PastQuestionPaper.find(filter)
                .populate(
                    "courseId",
                    "courseCode courseTitle courseScope department level semester"
                )
                .select(
                    "courseId academicYear semester title description fileUrl fileType publishedAt createdAt"
                )
                .sort({ academicYear: -1, createdAt: -1 })
                .skip(skip)
                .limit(pageLimit)
                .lean(),

            PastQuestionPaper.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            count: papers.length,
            total,
            page: pageNumber,
            totalPages: Math.ceil(total / pageLimit),
            papers,
        });
    } catch (error) {
        console.error("GET STUDENT PAST QUESTION PAPERS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve past-question papers.",
        });
    }
};


// Get verified questions without exposing their answers.

// Get verified questions with answers for read-only browsing.
exports.GetStudentPastQuestions = async (req, res) => {
    try {
        const { paperId } = req.params;

        if (!mongoose.isValidObjectId(paperId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid past-question paper ID.",
            });
        }

        if (!req.user || !mongoose.isValidObjectId(req.user.id)) {
            return res.status(401).json({
                success: false,
                message: "Student authentication is invalid.",
            });
        }

        const paper = await getAccessiblePaper(req.user.id, paperId);

        if (!paper) {
            return res.status(404).json({
                success: false,
                message: "Past-question paper not found or unavailable.",
            });
        }

        const questions = await PastQuestion.find({
            paperId,
            isVerified: true,
        })
            .select(
                "_id questionNumber questionText questionType options correctOptionIndex correctAnswer explanation marks"
            )
            .sort({ questionNumber: 1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: questions.length,
            paper: {
                _id: paper._id,
                title: paper.title,
                academicYear: paper.academicYear,
                semester: paper.semester,
                course: paper.courseId,
            },
            questions,
        });
    } catch (error) {
        console.error("GET STUDENT PAST QUESTIONS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve past questions.",
        });
    }
};



// Reveal the model answer for a written practice question.
exports.RevealWrittenAnswer = async (req, res) => {
    try {
        const { questionId } = req.params;

        if (!mongoose.isValidObjectId(questionId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid question ID.",
            });
        }

        if (!req.user || !mongoose.isValidObjectId(req.user.id)) {
            return res.status(401).json({
                success: false,
                message: "Student authentication is invalid.",
            });
        }

        const question = await PastQuestion.findOne({
            _id: questionId,
            isVerified: true,
            questionType: "written",
        }).lean();

        if (!question) {
            return res.status(404).json({
                success: false,
                message: "Verified written question not found.",
            });
        }

        const paper = await getAccessiblePaper(
            req.user.id,
            question.paperId
        );

        if (!paper) {
            return res.status(404).json({
                success: false,
                message: "Past-question paper not found or unavailable.",
            });
        }

        return res.status(200).json({
            success: true,
            questionId: question._id,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            marks: question.marks,
            message: "Model answer retrieved successfully.",
        });
    } catch (error) {
        console.error("REVEAL WRITTEN ANSWER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve the model answer.",
        });
    }
};
