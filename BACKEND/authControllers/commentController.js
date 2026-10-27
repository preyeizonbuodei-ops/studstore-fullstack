const mongoose = require("mongoose");
const { ValidateComment } = require("../middlewares/validate");
const Comment = require("../modules/comment");

// Check whether the requester owns the comment.
const canManageComment = (comment, user) => {
    if (!comment || !user?._id) {
        return false;
    }

    const ownerId = comment.username?._id
        ? comment.username._id
        : comment.username;

    const isOwner = String(ownerId) === String(user._id);
    const isAdmin =
        String(user.role || "").toLowerCase() === "admin";

    return isOwner || isAdmin;
};


// CREATE COMMENT
exports.CreateComment = async (req, res) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({
                success: false,
                message: "Please log in to submit feedback.",
            });
        }

        const { error, value } = ValidateComment.validate({
            comment:
                typeof req.body.comment === "string"
                    ? req.body.comment.trim()
                    : req.body.comment,
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const newComment = await Comment.create({
            comment: value.comment,
            username: req.user._id,
        });

        return res.status(201).json({
            success: true,
            message: "Your feedback was submitted successfully.",
            comment: newComment,
        });
    } catch (error) {
        console.error("CREATE COMMENT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to submit your feedback.",
        });
    }
};


// GET ALL COMMENTS
// GET ALL COMMENTS
exports.GetAllComments = async (req, res) => {
    try {
        const comments = await Comment.find()
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Comments retrieved successfully.",
            comments,
        });
    } catch (error) {
        console.error("GET ALL COMMENTS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve comments.",
        });
    }
};

// GET ONE COMMENT
exports.GetOneComment = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid comment ID.",
            });
        }

        const comment = await Comment.findById(id);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found.",
            });
        }

        return res.status(200).json({
            success: true,
            comment,
        });
    } catch (error) {
        console.error("GET ONE COMMENT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve the comment.",
        });
    }
};


// UPDATE COMMENT
exports.UpdateComment = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid comment ID.",
            });
        }

        const existingComment = await Comment.findById(id);

        if (!existingComment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found.",
            });
        }

        if (!canManageComment(existingComment, req.user)) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to edit this comment.",
            });
        }

        const { error, value } = ValidateComment.validate({
            comment:
                typeof req.body.comment === "string"
                    ? req.body.comment.trim()
                    : req.body.comment,
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        existingComment.comment = value.comment;

        await existingComment.save();

        return res.status(200).json({
            success: true,
            message: "Comment updated successfully.",
            comment: existingComment,
        });
    } catch (error) {
        console.error("UPDATE COMMENT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update the comment.",
        });
    }
};


// DELETE COMMENT
exports.DeleteComment = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid comment ID.",
            });
        }

        const existingComment = await Comment.findById(id);

        if (!existingComment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found.",
            });
        }

        if (!canManageComment(existingComment, req.user)) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to delete this comment.",
            });
        }

        await existingComment.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Comment deleted successfully.",
        });
    } catch (error) {
        console.error("DELETE COMMENT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete the comment.",
        });
    }
};