const mongoose = require("mongoose");

const LessonSchema = new mongoose.Schema(
    {
        TopicId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Topic",
            required: true
        },

        LessonNumber: {
            type: Number,
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        content: {
            type: String,
            required: true
        },

        examples: {
            type: String
        },

        videos: [
            {
                title: {
                    type: String,
                    trim: true
                },
                url: {
                    type: String,
                    trim: true
                }
            }
        ],

        materials: [
            {
                title: {
                    type: String,
                    trim: true
                },
                url: {
                    type: String,
                    trim: true
                }
            }
        ],

        resources: [
            {
                title: {
                    type: String,
                    trim: true
                },
                url: {
                    type: String,
                    trim: true
                }
            }
        ]
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Lesson", LessonSchema);