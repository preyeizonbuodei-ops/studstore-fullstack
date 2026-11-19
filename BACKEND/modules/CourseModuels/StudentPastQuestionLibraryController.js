
const mongoose = require("mongoose");

const QuestionPaper = require("../../modules/CourseModuels/PastQuestionLibrarySchema");
const Courses = require("../../modules/CourseModuels/Courses");
const User = require("../../modules/registerSchema");

// Get published past-question PDFs available to the logged-in student
exports.getStudentPastQuestionPapers = async (req, res) => {
    try {
        const student = await User.findById(req.user.id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const eligibleCourses = await Courses.find({
            $or: [
                {
                    courseType: "general"
                },
                {
                    courseType: "semester",
                    level: student.level,
                    $or: [
                        {
                            courseScope: "shared"
                        },
                        {
                            courseScope: "department",
                            department: student.department
                        }
                    ]
                }
            ]
        }).select("_id");

        const courseIds = eligibleCourses.map(course => course._id);

        const papers = await QuestionPaper.find({
            courseId: { $in: courseIds },
            status: "published"
        })
            .populate(
                "courseId",
                "courseCode courseTitle courseType courseScope department level semester"
            )
            .sort({
                academicYear: -1,
                createdAt: -1
            });

        return res.status(200).json({
            success: true,
            count: papers.length,
            papers
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching past-question PDFs"
        });
    }
};

// Get one published past-question PDF
exports.getStudentPastQuestionPaperById = async (req, res) => {
    try {
        const { paperId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(paperId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid paper ID"
            });
        }

        const student = await User.findById(req.user.id);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const paper = await QuestionPaper.findOne({
            _id: paperId,
            status: "published"
        }).populate(
            "courseId",
            "courseCode courseTitle courseType courseScope department level semester"
        );

        if (!paper || !paper.courseId) {
            return res.status(404).json({
                success: false,
                message: "Published past-question PDF not found"
            });
        }

        const course = paper.courseId;

        const isGeneralCourse = course.courseType === "general";

        const isEligibleSemesterCourse =
            course.courseType === "semester" &&
            course.level === student.level &&
            (
                course.courseScope === "shared" ||
                (
                    course.courseScope === "department" &&
                    course.department === student.department
                )
            );

        if (!isGeneralCourse && !isEligibleSemesterCourse) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this past-question PDF"
            });
        }

        return res.status(200).json({
            success: true,
            paper
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching past-question PDF"
        });
    }
};