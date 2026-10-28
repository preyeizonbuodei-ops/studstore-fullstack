const mongoose = require("mongoose");
const { ValidateComment } = require("../middlewares/validate");
const Comment = require("../modules/comment");

const USER_FIELDS =
    "username name firstName lastName displayName fullName";

const getUserId = (user) => user?._id || user?.id;

const isAdmin = (user) =>
    String(user?.role || "").toLowerCase() === "admin";

// Check whether the requester owns the comment or is an admin.
const canManageComment = (comment, user) => {
    const userId = getUserId(user);

    if (!comment || !userId) {
        return false;
    }

    const ownerId = comment.username?._id
        ? comment.username._id
        : comment.username;

    const isOwner =
        Boolean(ownerId) &&
        String(ownerId) === String(userId);

    return isOwner || isAdmin(user);
};

// Check ownership of an individual reply.
const canManageReply = (reply, user) => {
    const userId = getUserId(user);

    if (!reply || !userId) {
        return false;
    }

    const ownerId = reply.user?._id
        ? reply.user._id
        : reply.user;

    const isOwner =
        Boolean(ownerId) &&
        String(ownerId) === String(userId);

    return isOwner || isAdmin(user);
};

// Add ownership information needed by the frontend.
const serializeComment = (comment, userId) => {
    const item =
        typeof comment.toObject === "function"
            ? comment.toObject()
            : { ...comment };

    const authorId = item.username?._id || item.username;

    const likes = Array.isArray(item.likes)
        ? item.likes
        : [];

    const replies = Array.isArray(item.replies)
        ? item.replies.map((reply) => {
              const replyAuthorId =
                  reply.user?._id || reply.user;

              return {
                  ...reply,
                  isOwnReply:
                      Boolean(userId && replyAuthorId) &&
                      String(replyAuthorId) === String(userId),
              };
          })
        : [];

    return {
        ...item,
        replies,
        isOwnComment:
            Boolean(userId && authorId) &&
            String(authorId) === String(userId),
        likedByCurrentUser:
            Boolean(userId) &&
            likes.some(
                (like) =>
                    String(like?._id || like) === String(userId)
            ),
    };
};

// Populate comment authors and reply authors.
const populateComment = async (comment) => {
    if (!comment) return null;

    await comment.populate([
        { path: "username", select: USER_FIELDS },
        { path: "replies.user", select: USER_FIELDS },
    ]);

    return comment;
};

// CREATE COMMENT
exports.CreateComment = async (req, res) => {
    try {
        const userId = getUserId(req.user);

        if (!userId) {
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
            username: userId,
            comment: value.comment,
        });

        await populateComment(newComment);

        return res.status(201).json({
            success: true,
            message: "Your feedback was submitted successfully.",
            comment: serializeComment(newComment, userId),
        });
    } catch (error) {
        console.error("CREATE COMMENT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to submit your feedback.",
        });
    }
};

// GET ALL COMMENTS WITH PAGINATION
exports.GetAllComments = async (req, res) => {
    try {
        const userId = getUserId(req.user);

        const page = Math.max(
            1,
            parseInt(req.query.page, 10) || 1
        );

        const limit = Math.min(
            20,
            Math.max(1, parseInt(req.query.limit, 10) || 10)
        );

        const skip = (page - 1) * limit;

        const [comments, total] = await Promise.all([
            Comment.find()
                .populate("username", USER_FIELDS)
                .populate("replies.user", USER_FIELDS)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),

            Comment.countDocuments(),
        ]);

        const commentsWithOwnership = comments.map((comment) =>
            serializeComment(comment, userId)
        );

        return res.status(200).json({
            success: true,
            message: "Comments retrieved successfully.",
            comments: commentsWithOwnership,
            pagination: {
                page,
                limit,
                total,
                hasMore: skip + comments.length < total,
            },
        });
    } catch (error) {
        console.error("GET ALL COMMENTS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve comments.",
        });
    }
};

// GET ONE COMMENT
exports.GetOneComment = async (req, res) => {
    try {
        const userId = getUserId(req.user);
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

        await populateComment(comment);

        return res.status(200).json({
            success: true,
            comment: serializeComment(comment, userId),
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
        const userId = getUserId(req.user);
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

        if (existingComment.isDeleted) {
            return res.status(400).json({
                success: false,
                message: "A deleted comment cannot be edited.",
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

        await populateComment(existingComment);

        return res.status(200).json({
            success: true,
            message: "Comment updated successfully.",
            comment: serializeComment(existingComment, userId),
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
// Preserve comments with replies as deleted placeholders.
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

        if (existingComment.isDeleted) {
            return res.status(200).json({
                success: true,
                message: "This comment has already been deleted.",
                preserved: true,
            });
        }

        const hasReplies =
            Array.isArray(existingComment.replies) &&
            existingComment.replies.length > 0;

        if (hasReplies) {
            existingComment.comment = "This comment was deleted.";
            existingComment.isDeleted = true;
            existingComment.likes = [];

            await existingComment.save();

            return res.status(200).json({
                success: true,
                message:
                    "Comment deleted. Existing replies have been preserved.",
                preserved: true,
            });
        }

        await existingComment.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Comment deleted successfully.",
            preserved: false,
        });
    } catch (error) {
        console.error("DELETE COMMENT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete the comment.",
        });
    }
};

// LIKE OR UNLIKE A COMMENT
exports.ToggleCommentLike = async (req, res) => {
    try {
        const userId = getUserId(req.user);
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please log in to like a comment.",
            });
        }

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid comment ID.",
            });
        }

        const comment = await Comment.findById(id).select(
            "likes isDeleted"
        );

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found.",
            });
        }

        if (comment.isDeleted) {
            return res.status(400).json({
                success: false,
                message: "You cannot like a deleted comment.",
            });
        }

        const alreadyLiked = (comment.likes || []).some(
            (likeId) => String(likeId) === String(userId)
        );

        const updatedComment = await Comment.findByIdAndUpdate(
            id,
            alreadyLiked
                ? { $pull: { likes: userId } }
                : { $addToSet: { likes: userId } },
            { new: true }
        );

        await populateComment(updatedComment);

        return res.status(200).json({
            success: true,
            message: alreadyLiked
                ? "Like removed."
                : "Comment liked successfully.",
            comment: serializeComment(updatedComment, userId),
            liked: !alreadyLiked,
        });
    } catch (error) {
        console.error("TOGGLE COMMENT LIKE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to like this comment.",
        });
    }
};

// REPLY TO A COMMENT
exports.AddCommentReply = async (req, res) => {
    try {
        const userId = getUserId(req.user);
        const { id } = req.params;

        const text =
            typeof req.body.text === "string"
                ? req.body.text.trim()
                : "";

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please log in to reply to a comment.",
            });
        }

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid comment ID.",
            });
        }

        if (!text || text.length > 2000) {
            return res.status(400).json({
                success: false,
                message:
                    "Your reply must contain between 1 and 2000 characters.",
            });
        }

        const existingComment = await Comment.findById(id).select(
            "isDeleted"
        );

        if (!existingComment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found.",
            });
        }

        if (existingComment.isDeleted) {
            return res.status(400).json({
                success: false,
                message: "You cannot reply to a deleted comment.",
            });
        }

        const comment = await Comment.findByIdAndUpdate(
            id,
            {
                $push: {
                    replies: {
                        user: userId,
                        text,
                    },
                },
            },
            {
                new: true,
                runValidators: true,
            }
        );

        await populateComment(comment);

        return res.status(201).json({
            success: true,
            message: "Your reply was added successfully.",
            comment: serializeComment(comment, userId),
        });
    } catch (error) {
        console.error("ADD COMMENT REPLY ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to add your reply.",
        });
    }
};

// EDIT A REPLY
exports.UpdateCommentReply = async (req, res) => {
    try {
        const userId = getUserId(req.user);
        const { id, replyId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please log in to edit your reply.",
            });
        }

        if (
            !mongoose.isValidObjectId(id) ||
            !mongoose.isValidObjectId(replyId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid comment or reply ID.",
            });
        }

        const text =
            typeof req.body.text === "string"
                ? req.body.text.trim()
                : "";

        if (!text || text.length > 2000) {
            return res.status(400).json({
                success: false,
                message:
                    "Your reply must contain between 1 and 2000 characters.",
            });
        }

        const comment = await Comment.findById(id);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found.",
            });
        }

        const reply = comment.replies.id(replyId);

        if (!reply) {
            return res.status(404).json({
                success: false,
                message: "Reply not found.",
            });
        }

        if (!canManageReply(reply, req.user)) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to edit this reply.",
            });
        }

        reply.text = text;
        reply.editedAt = new Date();

        await comment.save();
        await populateComment(comment);

        return res.status(200).json({
            success: true,
            message: "Reply updated successfully.",
            comment: serializeComment(comment, userId),
        });
    } catch (error) {
        console.error("UPDATE COMMENT REPLY ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update the reply.",
        });
    }
};

// DELETE A REPLY
exports.DeleteCommentReply = async (req, res) => {
    try {
        const userId = getUserId(req.user);
        const { id, replyId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please log in to delete your reply.",
            });
        }

        if (
            !mongoose.isValidObjectId(id) ||
            !mongoose.isValidObjectId(replyId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid comment or reply ID.",
            });
        }

        const comment = await Comment.findById(id);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found.",
            });
        }

        const reply = comment.replies.id(replyId);

        if (!reply) {
            return res.status(404).json({
                success: false,
                message: "Reply not found.",
            });
        }

        if (!canManageReply(reply, req.user)) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to delete this reply.",
            });
        }

        comment.replies.pull({ _id: replyId });

        await comment.save();
        await populateComment(comment);

        return res.status(200).json({
            success: true,
            message: "Reply deleted successfully.",
            comment: serializeComment(comment, userId),
        });
    } catch (error) {
        console.error("DELETE COMMENT REPLY ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete the reply.",
        });
    }
};

// REPLY TO A STUDENT COMMENT AS ADMIN
// REPLY TO A STUDENT COMMENT AS ADMIN
exports.AddAdminCommentReply = async (req, res) => {
    try {
        // ValidateAdminToken may attach the admin to req.admin.
        const admin = req.admin || req.user;

        const adminId =
            getUserId(admin) ||
            admin?.adminId ||
            (typeof admin === "string" ? admin : null);

        const { id } = req.params;

        const text =
            typeof req.body.text === "string"
                ? req.body.text.trim()
                : "";

        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: "Admin authentication is required.",
            });
        }

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid comment ID.",
            });
        }

        if (!text || text.length > 2000) {
            return res.status(400).json({
                success: false,
                message:
                    "The admin reply must contain between 1 and 2000 characters.",
            });
        }

        const comment = await Comment.findById(id);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found.",
            });
        }

        if (comment.isDeleted) {
            return res.status(400).json({
                success: false,
                message: "You cannot reply to a removed comment.",
            });
        }

        comment.replies.push({
            authorType: "admin",
            adminId,
            text,
        });

        await comment.save();
        await populateComment(comment);

        return res.status(201).json({
            success: true,
            message: "Admin reply added successfully.",
            comment: serializeComment(comment, adminId),
        });
    } catch (error) {
        console.error("ADD ADMIN COMMENT REPLY ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to add the admin reply.",
        });
    }
};