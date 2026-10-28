const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
    {
        username: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        comment: {
            type: String,
            required: true,
            trim: true,
        },

        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        replies: [
            {
                // Identifies whether the reply came from a student or admin.
                authorType: {
                    type: String,
                    enum: ["student", "admin"],
                    default: "student",
                    required: true,
                },

                // Used for student replies.
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: function () {
                        return this.authorType === "student";
                    },
                },

                // Records the admin account ID without assuming its model name.
                adminId: {
                    type: mongoose.Schema.Types.ObjectId,
                    default: null,
                },

                text: {
                    type: String,
                    required: true,
                    trim: true,
                    maxlength: 2000,
                },

                createdAt: {
                    type: Date,
                    default: Date.now,
                },

                editedAt: {
                    type: Date,
                    default: null,
                },
            },
        ],

        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Comment", CommentSchema);