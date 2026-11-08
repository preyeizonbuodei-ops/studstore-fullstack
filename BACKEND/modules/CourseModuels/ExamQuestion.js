
const mongoose = require("mongoose");

const examQuestionSchema = new mongoose.Schema(
    {
        examId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Exam",
            required: true,
            index: true,
        },

        questionBankQuestionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "QuestionBankQuestion",
            default: null,
            },

        questionText: {
            type: String,
            required: true,
            trim: true,
            maxlength: 10000,
        },

        questionType: {
            type: String,
            enum: ["mcq", "written"],
            required: true,
        },

        // Used for multiple-choice questions.
        options: {
            type: [
                {
                    type: String,
                    trim: true,
                    maxlength: 2000,
                },
            ],
            default: [],
            validate: {
                validator: function (options) {
                    if (this.questionType !== "mcq") {
                        return options.length === 0;
                    }

                    return (
                        options.length >= 2 &&
                        options.every((option) => option.length > 0) &&
                        new Set(options).size === options.length
                    );
                },
                message:
                    "Multiple-choice questions require at least two non-empty, unique options.",
            },
        },

        // Zero-based index of the correct option.
        // Never return this field during an active exam.
        correctOptionIndex: {
            type: Number,
            default: null,
            validate: {
                validator: function (value) {
                    if (this.questionType !== "mcq") {
                        return value === null;
                    }

                    return (
                        Number.isInteger(value) &&
                        value >= 0 &&
                        value < this.options.length
                    );
                },
                message:
                    "The correct option index must reference an existing option.",
            },
        },

        // Used for written-answer questions and manual marking.
        correctAnswer: {
            type: String,
            trim: true,
            maxlength: 10000,
            default: null,
        },

        explanation: {
            type: String,
            trim: true,
            maxlength: 10000,
            default: "",
        },

        marks: {
            type: Number,
            required: true,
            min: 1,
            max: 1000,
        },

        questionSource: {
            type: String,
            enum: ["past_question", "manual", "ai"],
            default: "manual",
            required: true,
        },

        reviewStatus: {
            type: String,
            enum: ["not_required", "pending", "approved", "rejected"],
            default: "not_required",
            required: true,
        },

        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            default: null,
        },

        reviewedAt: {
            type: Date,
            default: null,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Keep question ordering predictable within an exam.
examQuestionSchema.index({
    examId: 1,
    createdAt: 1,
});

module.exports = mongoose.model("ExamQuestion", examQuestionSchema);
