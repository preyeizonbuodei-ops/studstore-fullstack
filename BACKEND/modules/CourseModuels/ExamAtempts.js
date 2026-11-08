
const mongoose = require("mongoose");

const examAttemptSchema = new mongoose.Schema(
    {
        examId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Exam",
            required: true,
        },

        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // The student chooses their preferred mode when starting.
        selectedMode: {
            type: String,
            enum: ["cbt", "handwritten"],
            required: true,
        },

        // Practice attempts can be untimed.
        // CBT attempts use the duration configured on the exam.
        startedAt: {
            type: Date,
            required: true,
            default: Date.now,
        },

        deadline: {
            type: Date,
            default: null,
        },

        submittedAt: {
            type: Date,
            default: null,
        },

        status: {
            type: String,
            enum: ["in-progress", "submitted", "expired"],
            default: "in-progress",
            required: true,
        },

        answers: [
            {
                questionId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "ExamQuestion",
                    required: true,
                },

                // Used for multiple-choice answers.
                selectedOptionIndex: {
                    type: Number,
                    default: null,
                },

                // Used for typed written answers.
                writtenAnswer: {
                    type: String,
                    trim: true,
                    maxlength: 20000,
                    default: "",
                },

                // Reserved for future manual or assisted marking.
                awardedMarks: {
                    type: Number,
                    default: null,
                    min: 0,
                },

                markingStatus: {
                    type: String,
                    enum: ["pending", "marked"],
                    default: "pending",
                },

                feedback: {
                    type: String,
                    default: "",
                    maxlength: 10000,
                },
            },
        ],

        totalMarks: {
            type: Number,
            default: 0,
            min: 0,
        },

        score: {
            type: Number,
            default: null,
            min: 0,
        },

        percentage: {
            type: Number,
            default: null,
            min: 0,
            max: 100,
        },

        resultsReleased: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Efficiently retrieve a student's exam history.
examAttemptSchema.index({
    studentId: 1,
    createdAt: -1,
});

// Efficiently retrieve attempts for an exam.
examAttemptSchema.index({
    examId: 1,
    status: 1,
});

module.exports = mongoose.model("ExamAttempt", examAttemptSchema);
