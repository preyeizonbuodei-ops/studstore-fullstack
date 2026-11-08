
const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 2000,
        },

        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },

        // Leave topicId empty for a course-wide exam.
        // Set topicId for an exam covering one specific topic.
        topicId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Topic",
            default: null,
        },

        examMode: {
            type: String,
            enum: ["practice", "cbt"],
            required: true,
            default: "practice",
        },

        duration: {
            type: Number,
            required: function () {
                return this.examMode === "cbt";
            },
            min: 1,
            validate: {
                validator: function (value) {
                    return (
                        this.examMode !== "cbt" ||
                        (Number.isFinite(value) && value >= 1)
                    );
                },
                message: "A timed CBT exam must have a duration of at least 1 minute.",
            },
        },

        instructions: {
            type: String,
            trim: true,
            maxlength: 5000,
        },

        status: {
            type: String,
            enum: ["draft", "published", "archived"],
            default: "draft",
            required: true,
        },

        createdBy: {
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

// Efficiently find published exams for a course.
examSchema.index({
    courseId: 1,
    status: 1,
});

// Efficiently find exams for a particular topic.
examSchema.index({
    topicId: 1,
    status: 1,
});

// Efficiently filter exams by mode.
examSchema.index({
    examMode: 1,
    status: 1,
});

module.exports = mongoose.model("Exam", examSchema);
