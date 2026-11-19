
const mongoose = require("mongoose");

const questionPaperSchema = new mongoose.Schema(
    {
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        academicYear: {
            type: String,
            required: true,
            trim: true,
        },

        semester: {
            type: String,
            enum: ["first", "second", "not-specified"],
            default: "not-specified",
        },

        fileUrl: {
            type: String,
            required: true,
            trim: true,
        },

        publicId: {
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

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
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

// Multiple papers can belong to the same course and academic year.
questionPaperSchema.index({
    courseId: 1,
    academicYear: 1,
    semester: 1,
    status: 1,
});

module.exports = mongoose.model(
    "QuestionPaper",
    questionPaperSchema
);
