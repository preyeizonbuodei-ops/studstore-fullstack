const ValidateLesson = require(
    "../../middlewares/Admin/validateLesson"
);

const Topic = require(
    "../../modules/CourseModuels/TopicSchema"
);

const Lesson = require(
    "../../modules/CourseModuels/LessonSchema"
);


// CREATE LESSON INSIDE A TOPIC
exports.CreateLesson = async (req, res) => {
    try {
        // Accept the topic ID from either the route or request body.
        const topicId =
            req.params.topicId ||
            req.params.TopicId ||
            req.body.topicId ||
            req.body.TopicId;

        const {
            title,
            content,
            examples,
            videos,
            materials,
            resources,
        } = req.body;

        const lessonNumber =
            req.body.lessonNumber ??
            req.body.LessonNumber;

        const { error, value } = ValidateLesson.validate({
            topicId,
            lessonNumber,
            title,
            content,
            examples,
            videos,
            materials,
            resources,
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const existingTopic = await Topic.findById(
            value.topicId
        );

        if (!existingTopic) {
            return res.status(404).json({
                success: false,
                message: "Topic not found",
            });
        }

        // Map lowercase request fields to your current
        // Mongoose schema field names.
        const lesson = await Lesson.create({
            TopicId: value.topicId,
            LessonNumber: value.lessonNumber,
            title: value.title,
            content: value.content,
            examples: value.examples ?? "",
            videos: value.videos ?? [],
            materials: value.materials ?? [],
            resources: value.resources ?? [],
        });

        return res.status(201).json({
            success: true,
            message: "Lesson created successfully",
            lesson,
        });
    } catch (error) {
        console.error("CREATE LESSON ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating lesson",
        });
    }
};


// GET ALL LESSONS
// Useful for admin pages that need to find a lesson by ID.
exports.GetLessons = async (req, res) => {
    try {
        const lessons = await Lesson.find().sort({
            LessonNumber: 1,
        });

        return res.status(200).json({
            success: true,
            message: "Lessons retrieved successfully",
            lessons,
        });
    } catch (error) {
        console.error("GET LESSONS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching lessons",
        });
    }
};


// GET LESSONS BELONGING TO ONE TOPIC
exports.GetLessonsByTopic = async (req, res) => {
    try {
        const topicId =
            req.params.topicId ||
            req.params.TopicId;

        if (!topicId) {
            return res.status(400).json({
                success: false,
                message: "Topic ID is required",
            });
        }

        const topic = await Topic.findById(topicId);

        if (!topic) {
            return res.status(404).json({
                success: false,
                message: "Topic not found",
            });
        }

        const lessons = await Lesson.find({
            TopicId: topic._id,
        }).sort({
            LessonNumber: 1,
        });

        return res.status(200).json({
            success: true,
            message: "Lessons retrieved successfully",
            lessons,
        });
    } catch (error) {
        console.error(
            "GET LESSONS BY TOPIC ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error while fetching topic lessons",
        });
    }
};


// UPDATE LESSON
exports.UpdateLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;

        const existingLesson = await Lesson.findById(
            lessonId
        );

        if (!existingLesson) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found",
            });
        }

        // Construct the complete validated data using existing
        // values for any fields omitted from a PATCH request.
        const updatedData = {
            topicId:
                req.body.topicId ??
                req.body.TopicId ??
                existingLesson.TopicId.toString(),

            lessonNumber:
                req.body.lessonNumber ??
                req.body.LessonNumber ??
                existingLesson.LessonNumber,

            title:
                req.body.title ??
                existingLesson.title,

            content:
                req.body.content ??
                existingLesson.content,

            examples:
                req.body.examples ??
                existingLesson.examples ??
                "",

            videos:
                req.body.videos ??
                existingLesson.videos ??
                [],

            materials:
                req.body.materials ??
                existingLesson.materials ??
                [],

            resources:
                req.body.resources ??
                existingLesson.resources ??
                [],
        };

        const { error, value } = ValidateLesson.validate(
            updatedData
        );

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const existingTopic = await Topic.findById(
            value.topicId
        );

        if (!existingTopic) {
            return res.status(404).json({
                success: false,
                message: "Topic not found",
            });
        }

        // Preserve the current database schema's field names.
        existingLesson.set({
            TopicId: value.topicId,
            LessonNumber: value.lessonNumber,
            title: value.title,
            content: value.content,
            examples: value.examples,
            videos: value.videos,
            materials: value.materials,
            resources: value.resources,
        });

        await existingLesson.save();

        return res.status(200).json({
            success: true,
            message: "Lesson updated successfully",
            lesson: existingLesson,
        });
    } catch (error) {
        console.error("UPDATE LESSON ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating lesson",
        });
    }
};


// DELETE LESSON
exports.DeleteLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;

        const deletedLesson =
            await Lesson.findByIdAndDelete(lessonId);

        if (!deletedLesson) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Lesson deleted successfully",
            lesson: deletedLesson,
        });
    } catch (error) {
        console.error("DELETE LESSON ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while deleting lesson",
        });
    }
};