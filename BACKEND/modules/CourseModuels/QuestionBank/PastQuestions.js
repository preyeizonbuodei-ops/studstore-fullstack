
const mongoose = require("mongoose");

const pastQuestionSchema = new mongoose.Schema(
    {
        paperId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PastQuestionPaper",
            required: true,
        },

        questionNumber: {
            type: Number,
            required: true,
            min: 1,
        },

        questionText: {
            type: String,
            required: true,
            trim: true,
        },

        questionType: {
            type: String,
            enum: ["mcq", "written"],
            required: true,
            default: "written",
        },

        options: {
            type: [String],
            default: [],
            validate: {
                validator: function (value) {
                    return (
                        this.questionType !== "mcq" ||
                        !this.isVerified ||
                        (Array.isArray(value) && value.length >= 2)
                    );
                },
                message:
                    "A verified multiple-choice question must have at least two options.",
            },
        },

        correctOptionIndex: {
            type: Number,
            default: null,
            validate: {
                validator: function (value) {
                    return (
                        value === null ||
                        (
                            this.questionType === "mcq" &&
                            Number.isInteger(value) &&
                            value >= 0 &&
                            value < this.options.length
                        )
                    );
                },
                message: "Invalid correct option index.",
            },
        },

        correctAnswer: {
            type: String,
            trim: true,
            default: "",
        },

        explanation: {
            type: String,
            trim: true,
            default: "",
        },

        marks: {
            type: Number,
            min: 1,
            default: 1,
        },

        isVerified: {
            type: Boolean,
            default: false,
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


// Validate answers before a question can be verified.
pastQuestionSchema.pre("validate", function () {
    if (!this.isVerified) return;

    if (this.questionType === "mcq") {
        if (
            !Array.isArray(this.options) ||
            this.options.length < 2 ||
            !Number.isInteger(this.correctOptionIndex) ||
            this.correctOptionIndex < 0 ||
            this.correctOptionIndex >= this.options.length
        ) {
            this.invalidate(
                "correctOptionIndex",
                "A verified MCQ must have at least two options and a valid correct answer."
            );
        }
    }

    if (
        this.questionType === "written" &&
        !this.correctAnswer?.trim()
    ) {
        this.invalidate(
            "correctAnswer",
            "A verified written question must have a correct answer."
        );
    }
});


// Prevent duplicate question numbers within the same paper.
pastQuestionSchema.index(
    {
        paperId: 1,
        questionNumber: 1,
    },
    {
        unique: true,
    }
);

module.exports = mongoose.model(
    "QuestionBankQuestion",
    pastQuestionSchema
);
