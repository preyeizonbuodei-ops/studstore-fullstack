const ValidateLesson = require(
    "../../middlewares/Admin/validateLesson"
);

const Topic = require(
    "../../modules/CourseModuels/TopicSchema"
);

const Lesson = require(
    "../../modules/CourseModuels/LessonSchema"
);

// Convert plain URLs into the object format required by Joi and Mongoose.
// Accepts a newline-separated string, an array of URLs, or an array of objects.
const normalizeLinkItems = (items, label) => {
    if (
        items === undefined ||
        items === null ||
        items === ""
    ) {
        return [];
    }

    const list = Array.isArray(items)
        ? items
        : typeof items === "string"
            ? items.split(/\r?\n/)
            : [items];

    return list
        .map((item, index) => {
            if (typeof item === "string") {
                const url = item.trim();

                if (!url) {
                    return null;
                }

                return {
                    title: `${label} ${index + 1}`,
                    url,
                };
            }

            if (
                item &&
                typeof item === "object" &&
                !Array.isArray(item)
            ) {
                return {
                    title:
                        typeof item.title === "string" &&
                        item.title.trim()
                            ? item.title.trim()
                            : `${label} ${index + 1}`,
                    url:
                        typeof item.url === "string"
                            ? item.url.trim()
                            : item.url,
                };
            }

            // Preserve invalid values so Joi can report validation errors.
            return item;
        })
        .filter((item) => item !== null);
};


// CREATE LESSON INSIDE A TOPIC
exports.CreateLesson = async (req, res) => {
    try {
        const topicId =
            req.params.topicId ||
            req.params.TopicId ||
            req.body.topicId ||
            req.body.TopicId;

        const {
            title,
            content,
            examples,
        } = req.body;

        const lessonNumber =
            req.body.lessonNumber ??
            req.body.LessonNumber;

        // Convert URL strings into { title, url } objects before validation.
        const videos = normalizeLinkItems(
            req.body.videos,
            "Video"
        );

        const materials = normalizeLinkItems(
            req.body.materials,
            "Study Material"
        );

        const resources = normalizeLinkItems(
            req.body.resources,
            "Resource"
        );

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

        // Map request fields to the existing Mongoose schema.
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

        // Normalize incoming links and preserve existing values
        // when a PATCH request omits these fields.
        const videos = normalizeLinkItems(
            req.body.videos ?? existingLesson.videos,
            "Video"
        );

        const materials = normalizeLinkItems(
            req.body.materials ?? existingLesson.materials,
            "Study Material"
        );

        const resources = normalizeLinkItems(
            req.body.resources ?? existingLesson.resources,
            "Resource"
        );

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

            videos,
            materials,
            resources,
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

        existingLesson.set({
            TopicId: value.topicId,
            LessonNumber: value.lessonNumber,
            title: value.title,
            content: value.content,
            examples: value.examples,
            videos: value.videos ?? [],
            materials: value.materials ?? [],
            resources: value.resources ?? [],
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