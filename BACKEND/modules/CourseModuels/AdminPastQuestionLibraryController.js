
const mongoose = require("mongoose");

const QuestionPaper = require("../../modules/CourseModuels/PastQuestionLibrarySchema");
const Courses = require("../../modules/CourseModuels/Courses");

// Create a new past-question PDF record
exports.CreateQuestionPaper = async (req, res) => {
    try {
        const {
            courseId,
            title,
            academicYear,
            semester,
            fileUrl,
            publicId,
            description
        } = req.body;

        if (
            !courseId ||
            !title?.trim() ||
            !academicYear?.trim() ||
            !fileUrl?.trim() ||
            !publicId?.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Course, title, academic year, PDF URL and public ID are required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid course ID"
            });
        }

        const course = await Courses.findById(courseId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Selected course not found"
            });
        }

        const newPaper = new QuestionPaper({
            courseId,
            title: title.trim(),
            academicYear: academicYear.trim(),
            semester: semester || "not-specified",
            fileUrl: fileUrl.trim(),
            publicId: publicId.trim(),
            fileType: "pdf",
            description: description?.trim() || "",
            status: "draft",
            uploadedBy: req.admin.id
        });

        await newPaper.save();

        await newPaper.populate(
            "courseId",
            "courseCode courseTitle courseType courseScope department level semester"
        );

        return res.status(201).json({
            success: true,
            message: "Past-question PDF added successfully",
            paper: newPaper
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating past-question PDF"
        });
    }
};


// Get all past-question PDFs for the admin dashboard
exports.GetQuestionPapers = async (req, res) => {
    try {
        const papers = await QuestionPaper.find()
            .populate(
                "courseId",
                "courseCode courseTitle courseType courseScope department level semester"
            )
            .populate("uploadedBy", "username email")
            .sort({ createdAt: -1 });

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


// Get one past-question PDF
exports.GetQuestionPaperById = async (req, res) => {
    try {
        const { paperId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(paperId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid paper ID"
            });
        }

        const paper = await QuestionPaper.findById(paperId)
            .populate(
                "courseId",
                "courseCode courseTitle courseType courseScope department level semester"
            )
            .populate("uploadedBy", "username email");

        if (!paper) {
            return res.status(404).json({
                success: false,
                message: "Past-question PDF not found"
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


// Update past-question PDF details
exports.UpdateQuestionPaper = async (req, res) => {
    try {
        const { paperId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(paperId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid paper ID"
            });
        }

        const paper = await QuestionPaper.findById(paperId);

        if (!paper) {
            return res.status(404).json({
                success: false,
                message: "Past-question PDF not found"
            });
        }

        const {
            courseId,
            title,
            academicYear,
            semester,
            fileUrl,
            publicId,
            description
        } = req.body;

        if (courseId !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(courseId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid course ID"
                });
            }

            const course = await Courses.findById(courseId);

            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: "Selected course not found"
                });
            }

            paper.courseId = courseId;
        }

        if (title !== undefined) {
            if (!title.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Paper title cannot be empty"
                });
            }

            paper.title = title.trim();
        }

        if (academicYear !== undefined) {
            if (!academicYear.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Academic year cannot be empty"
                });
            }

            paper.academicYear = academicYear.trim();
        }

        if (semester !== undefined) {
            if (!["first", "second", "not-specified"].includes(semester)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid semester"
                });
            }

            paper.semester = semester;
        }

        if (fileUrl !== undefined) {
            if (!fileUrl.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "PDF URL cannot be empty"
                });
            }

            paper.fileUrl = fileUrl.trim();
        }

        if (publicId !== undefined) {
            if (!publicId.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Cloudinary public ID cannot be empty"
                });
            }

            paper.publicId = publicId.trim();
        }

        if (description !== undefined) {
            paper.description = description.trim();
        }

        await paper.save();

        await paper.populate(
            "courseId",
            "courseCode courseTitle courseType courseScope department level semester"
        );

        return res.status(200).json({
            success: true,
            message: "Past-question PDF updated successfully",
            paper
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating past-question PDF"
        });
    }
};


// Publish, unpublish or archive a past-question PDF
exports.UpdateQuestionPaperStatus = async (req, res) => {
    try {
        const { paperId } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(paperId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid paper ID"
            });
        }

        if (!["draft", "published", "archived"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be draft, published or archived"
            });
        }

        const paper = await QuestionPaper.findById(paperId);

        if (!paper) {
            return res.status(404).json({
                success: false,
                message: "Past-question PDF not found"
            });
        }

        paper.status = status;

        if (status === "published") {
            paper.publishedAt = new Date();
        } else {
            paper.publishedAt = null;
        }

        await paper.save();

        return res.status(200).json({
            success: true,
            message: `Past-question PDF ${status} successfully`,
            paper
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating past-question PDF status"
        });
    }
};


// Delete a past-question PDF record from MongoDB
exports.DeleteQuestionPaper = async (req, res) => {
    try {
        const { paperId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(paperId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid paper ID"
            });
        }

        const deletedPaper = await QuestionPaper.findByIdAndDelete(paperId);

        if (!deletedPaper) {
            return res.status(404).json({
                success: false,
                message: "Past-question PDF not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Past-question PDF deleted successfully",
            paper: deletedPaper
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error while deleting past-question PDF"
        });
    }
};
