
const mongoose = require("mongoose");

const pastQuestionPaperSchema = new mongoose.Schema(
    {
        // Connects the paper to an existing StudStore course.
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },

        // Example: 2023/2024
        academicYear: {
            type: String,
            required: true,
            trim: true,
        },

        semester: {
            type: String,
            enum: ["first", "second"],
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
        },

        publicId: {
            type: String,
            required: true,
            trim: true,
        },

        // Cloudinary URL of the original past question PDF.
        fileUrl: {
            type: String,
            required: true,
            trim: true,
        },

        fileType: {
            type: String,
            enum: ["pdf"],
            default: "pdf",
            required: true,
        },

        status: {
            type: String,
            enum: ["draft", "published", "archived"],
            default: "draft",
            required: true,
        },

        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            required: true,
        },

        publishedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Find past papers belonging to a course.
pastQuestionPaperSchema.index(
    {
        courseId: 1,
        academicYear: 1,
        semester: 1,
        title: 1,
    },
    { unique: true }
);

pastQuestionPaperSchema.index({
    courseId: 1,
    status: 1,
});

module.exports = mongoose.model(
    "PastQuestionPaper",
    pastQuestionPaperSchema
);
