const ValidateTopic = require(
  "../../middlewares/Admin/ValidateTopic"
);

const Course = require(
    "../../modules/CourseModuels/Courses"
);

const Lesson = require(
    "../../modules/CourseModuels/LessonSchema"
);

const Topic = require(
    "../../modules/CourseModuels/TopicSchema"
);


// CREATE TOPIC
exports.CreateTopic = async (req, res) => {
    try {
        const { courseId, title } = req.body;

        // Support both frontend naming conventions.
        const TopicNumber =
            req.body.TopicNumber ?? req.body.topicNumber;

        const { error, value } = ValidateTopic.validate({
            courseId,
            title,
            TopicNumber,
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const existingCourse = await Course.findById(
            value.courseId
        );

        if (!existingCourse) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        const topic = await Topic.create({
            courseId: value.courseId,
            title: value.title,
            TopicNumber: value.TopicNumber,
        });

        return res.status(201).json({
            success: true,
            message: "Topic created successfully",
            topic,
        });
    } catch (error) {
        console.error("CREATE TOPIC ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating topic",
        });
    }
};


// GET ALL TOPICS
exports.GetTopic = async (req, res) => {
    try {
        const topics = await Topic.find().sort({
            TopicNumber: 1,
        });

        return res.status(200).json({
            success: true,
            topics,
        });
    } catch (error) {
        console.error("GET TOPICS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching topics",
        });
    }
};


// GET TOPICS BELONGING TO A COURSE
exports.GetTopicByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        const existingCourse = await Course.findById(
            courseId
        );

        if (!existingCourse) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        const topics = await Topic.find({
            courseId,
        }).sort({
            TopicNumber: 1,
        });

        return res.status(200).json({
            success: true,
            topics,
        });
    } catch (error) {
        console.error("GET TOPICS BY COURSE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching topics",
        });
    }
};


// UPDATE TOPIC
exports.UpdateTopic = async (req, res) => {
    try {
        const { topicId } = req.params;

        const existingTopic = await Topic.findById(
            topicId
        );

        if (!existingTopic) {
            return res.status(404).json({
                success: false,
                message: "Topic not found",
            });
        }

        // Preserve fields not included in the PATCH request.
        const updatedData = {
            courseId:
                req.body.courseId ??
                existingTopic.courseId,

            title:
                req.body.title ??
                existingTopic.title,

            TopicNumber:
                req.body.TopicNumber ??
                req.body.topicNumber ??
                existingTopic.TopicNumber,
        };

        const { error, value } = ValidateTopic.validate(
            updatedData
        );

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const existingCourse = await Course.findById(
            value.courseId
        );

        if (!existingCourse) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        existingTopic.set({
            courseId: value.courseId,
            title: value.title,
            TopicNumber: value.TopicNumber,
        });

        await existingTopic.save();

        return res.status(200).json({
            success: true,
            message: "Topic updated successfully",
            topic: existingTopic,
        });
    } catch (error) {
        console.error("UPDATE TOPIC ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating topic",
        });
    }
};


// DELETE TOPIC
exports.DeleteTopic = async (req, res) => {
    try {
        const { topicId } = req.params;

        const existingTopic = await Topic.findById(
            topicId
        );

        if (!existingTopic) {
            return res.status(404).json({
                success: false,
                message: "Topic not found",
            });
        }

        // Lessons belong to topics through TopicId
        // in your currently shared Lesson schema.
        const existingLessons = await Lesson.exists({
            TopicId: existingTopic._id,
        });

        if (existingLessons) {
            return res.status(409).json({
                success: false,
                message:
                    "Cannot delete this topic because it contains lessons. Delete or move its lessons first.",
            });
        }

        await existingTopic.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Topic deleted successfully",
        });
    } catch (error) {
        console.error("DELETE TOPIC ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while deleting topic",
        });
    }
};



// Keep this export only if your existing routes import GetCourses
// from this controller. Otherwise, use your dedicated course controller.
exports.GetCourses = async (req, res) => {
    try {
        const courses = await Course.find().sort({
            courseTitle: 1,
        });

        return res.status(200).json({
            success: true,
            courses,
        });
    } catch (error) {
        console.error("GET COURSES ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching courses",
        });
    }
};