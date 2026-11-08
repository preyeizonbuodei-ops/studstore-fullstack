
const mongoose = require("mongoose");

const Course = require(
    "../../../modules/CourseModuels/Courses"
);

const PastQuestionPaper = require(
    "../../../modules/CourseModuels/QuestionBank/PastQuestionPapar"
);
const PastQuestion = require("../../../modules/CourseModuels/QuestionBank/PastQuestions");


// Validate Cloudinary PDF URL.
const isValidFileUrl = (fileUrl) => {
    if (typeof fileUrl !== "string" || !fileUrl.trim()) {
        return false;
    }

    try {
        const url = new URL(fileUrl.trim());

        return url.protocol === "https:";
    } catch {
        return false;
    }
};


// Validate admin authentication.
const isValidAdmin = (req) => {
    return (
        req.admin &&
        mongoose.isValidObjectId(req.admin.id)
    );
};


// CREATE / UPLOAD PAST QUESTION PAPER
exports.UploadPastQuestionPaper = async (req, res) => {
    try {
        if (!isValidAdmin(req)) {
            return res.status(401).json({
                success: false,
                message: "Admin authentication is invalid.",
            });
        }

        const {
            courseId,
            academicYear,
            semester,
            title,
            description = "",
            fileUrl,
            publicId,
        } = req.body;

        // Validate course ID.
        if (!mongoose.isValidObjectId(courseId)) {
            return res.status(400).json({
                success: false,
                message: "A valid course ID is required.",
            });
        }

        // Find existing course.
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found.",
            });
        }

        // Question Bank currently supports semester courses only.
        if (course.courseType !== "semester") {
            return res.status(400).json({
                success: false,
                message: "Past questions can only be uploaded for semester courses.",
            });
        }

        // Ensure paper semester matches course semester.
        if (
            semester !== course.semester ||
            !["first", "second"].includes(semester)
        ) {
            return res.status(400).json({
                success: false,
                message: "The paper semester must match the course semester.",
            });
        }

        // Validate academic year.
        if (
            typeof academicYear !== "string" ||
            !academicYear.trim() ||
            academicYear.trim().length > 20
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid academic year is required.",
            });
        }

        // Validate title.
        if (
            typeof title !== "string" ||
            !title.trim() ||
            title.trim().length > 200
        ) {
            return res.status(400).json({
                success: false,
                message: "Paper title is required and cannot exceed 200 characters.",
            });
        }

        // Validate description.
        if (
            typeof description !== "string" ||
            description.length > 1000
        ) {
            return res.status(400).json({
                success: false,
                message: "Description cannot exceed 1,000 characters.",
            });
        }

        // Validate Cloudinary URL.
        if (!isValidFileUrl(fileUrl)) {
            return res.status(400).json({
                success: false,
                message: "A valid HTTPS PDF URL is required.",
            });
        }

        // Validate Cloudinary public ID.
        if (
            typeof publicId !== "string" ||
            !publicId.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Cloudinary public ID is required.",
            });
        }

        const paper = await PastQuestionPaper.create({
            courseId: course._id,
            academicYear: academicYear.trim(),
            semester,
            title: title.trim(),
            description: description.trim(),
            fileUrl: fileUrl.trim(),
            publicId: publicId.trim(),
            fileType: "pdf",
            status: "draft",
            uploadedBy: req.admin.id,
        });

        return res.status(201).json({
            success: true,
            message: "Past-question paper uploaded successfully.",
            paper,
        });

    } catch (error) {
        console.error("UPLOAD PAST QUESTION PAPER ERROR:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A paper with this title already exists for this course, academic year and semester.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to upload past-question paper.",
        });
    }
};


// GET ALL PAST QUESTION PAPERS
exports.GetPastQuestionPapers = async (req, res) => {
    try {
        const {
            courseId,
            academicYear,
            semester,
            status,
        } = req.query;

        const page = Math.max(
            1,
            parseInt(req.query.page, 10) || 1
        );

        const limit = Math.min(
            100,
            Math.max(1, parseInt(req.query.limit, 10) || 20)
        );

        const filter = {};

        // Optional course filter.
        if (courseId) {
            if (!mongoose.isValidObjectId(courseId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid course ID.",
                });
            }

            const course = await Course.findById(courseId);

            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: "Course not found.",
                });
            }

            if (course.courseType !== "semester") {
                return res.status(400).json({
                    success: false,
                    message: "Question Bank only supports semester courses.",
                });
            }

            filter.courseId = course._id;
        }

        // Optional academic year filter.
        if (academicYear) {
            filter.academicYear = academicYear.trim();
        }

        // Optional semester filter.
        if (semester) {
            if (!["first", "second"].includes(semester)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid semester.",
                });
            }

            if (
                courseId &&
                filter.courseId
            ) {
                const course = await Course.findById(
                    filter.courseId
                );

                if (course.semester !== semester) {
                    return res.status(400).json({
                        success: false,
                        message: "The selected semester does not match the course semester.",
                    });
                }
            }

            filter.semester = semester;
        }

        // Optional publication status filter.
        if (status) {
            if (
                !["draft", "published", "archived"].includes(status)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid paper status.",
                });
            }

            filter.status = status;
        }

        const [papers, total] = await Promise.all([
            PastQuestionPaper.find(filter)
                .populate(
                    "courseId",
                    "courseTitle courseCode courseType courseScope department level semester"
                )
                .populate(
                    "uploadedBy",
                    "username email"
                )
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),

            PastQuestionPaper.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            message: "Past-question papers retrieved successfully.",
            papers,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });

    } catch (error) {
        console.error("GET PAST QUESTION PAPERS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve past-question papers.",
        });
    }
};


// GET ONE PAST QUESTION PAPER
exports.GetPastQuestionPaperById = async (req, res) => {
    try {
        const { paperId } = req.params;

        if (!mongoose.isValidObjectId(paperId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid paper ID.",
            });
        }

        const paper = await PastQuestionPaper.findById(paperId)
            .populate(
                "courseId",
                "courseTitle courseCode courseType courseScope department level semester"
            )
            .populate(
                "uploadedBy",
                "username email"
            )

        if (!paper) {
            return res.status(404).json({
                success: false,
                message: "Past-question paper not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Past-question paper retrieved successfully.",
            paper,
        });

    } catch (error) {
        console.error("GET PAST QUESTION PAPER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve past-question paper.",
        });
    }
};


// UPDATE PAST QUESTION PAPER
exports.UpdatePastQuestionPaper = async (req, res) => {
    try {
        const { paperId } = req.params;

        if (!mongoose.isValidObjectId(paperId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid paper ID.",
            });
        }

        const paper = await PastQuestionPaper.findById(paperId);

        if (!paper) {
            return res.status(404).json({
                success: false,
                message: "Past-question paper not found.",
            });
        }

        // Only draft papers can be edited.
        if (paper.status !== "draft") {
            return res.status(400).json({
                success: false,
                message: "Only draft past-question papers can be updated.",
            });
        }

        const {
            academicYear,
            title,
            description,
            fileUrl,
            publicId,
        } = req.body;

        const updateData = {};

        if (academicYear !== undefined) {
            if (
                typeof academicYear !== "string" ||
                !academicYear.trim() ||
                academicYear.trim().length > 20
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid academic year.",
                });
            }

            updateData.academicYear = academicYear.trim();
        }

        if (title !== undefined) {
            if (
                typeof title !== "string" ||
                !title.trim() ||
                title.trim().length > 200
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid paper title.",
                });
            }

            updateData.title = title.trim();
        }

        if (description !== undefined) {
            if (
                typeof description !== "string" ||
                description.length > 1000
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Description cannot exceed 1,000 characters.",
                });
            }

            updateData.description = description.trim();
        }

        // The PDF URL and public ID must be updated together.
        if (
            fileUrl !== undefined ||
            publicId !== undefined
        ) {
            if (
                !isValidFileUrl(fileUrl) ||
                typeof publicId !== "string" ||
                !publicId.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "A valid PDF URL and Cloudinary public ID must be provided together.",
                });
            }

            updateData.fileUrl = fileUrl.trim();
            updateData.publicId = publicId.trim();
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields were provided for update.",
            });
        }

        Object.assign(paper, updateData);

        await paper.save();

        return res.status(200).json({
            success: true,
            message: "Past-question paper updated successfully.",
            paper,
        });

    } catch (error) {
        console.error("UPDATE PAST QUESTION PAPER ERROR:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A paper with this title already exists for this course, academic year and semester.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to update past-question paper.",
        });
    }
};

// Publish a past-question paper
exports.PublishPastQuestionPaper = async (req, res) => {
    try {
        const { paperId } = req.params;

        if (!mongoose.isValidObjectId(paperId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid past-question paper ID."
            });
        }

        const paper = await PastQuestionPaper.findById(paperId);

        if (!paper) {
            return res.status(404).json({
                success: false,
                message: "Past-question paper not found."
            });
        }

        if (paper.status !== "draft") {
            return res.status(400).json({
                success: false,
                message: "Only draft papers can be published."
            });
        }

        const totalQuestions = await PastQuestion.countDocuments({
            paperId: paper._id
        });

        const verifiedQuestions = await PastQuestion.countDocuments({
            paperId: paper._id,
            isVerified: true
        });

        if (totalQuestions === 0) {
            return res.status(400).json({
                success: false,
                message: "This paper has no questions. Add questions before publishing."
            });
        }

        if (totalQuestions !== verifiedQuestions) {
            return res.status(400).json({
                success: false,
                message: "All questions must be verified before this paper can be published.",
                totalQuestions,
                verifiedQuestions
            });
        }

        paper.status = "published";
        paper.publishedAt = new Date();

        await paper.save();

        return res.status(200).json({
            success: true,
            message: "Past-question paper published successfully.",
            paper
        });

    } catch (error) {
        console.error("PublishPastQuestionPaper Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while publishing past-question paper."
        });
    }
};


// Archive a past-question paper
exports.ArchivePastQuestionPaper = async (req, res) => {
    try {
        const { paperId } = req.params;

        if (!mongoose.isValidObjectId(paperId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid past-question paper ID."
            });
        }

        const paper = await PastQuestionPaper.findById(paperId);

        if (!paper) {
            return res.status(404).json({
                success: false,
                message: "Past-question paper not found."
            });
        }

        if (paper.status === "archived") {
            return res.status(400).json({
                success: false,
                message: "This paper is already archived."
            });
        }

        paper.status = "archived";

        await paper.save();

        return res.status(200).json({
            success: true,
            message: "Past-question paper archived successfully.",
            paper
        });

    } catch (error) {
        console.error("ArchivePastQuestionPaper Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while archiving past-question paper."
        });
    }
};