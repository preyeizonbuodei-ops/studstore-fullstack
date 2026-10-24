const Lesson = require("../../modules/CourseModuels/LessonSchema");
const Topic = require("../../modules/CourseModuels/TopicSchema");

exports.Getlesson = async (req, res) => {
  try {
    const { courseId, topicId } = req.params;
    let lessonQuery;

    if (topicId) {
      const topic = await Topic.findById(topicId);

      if (!topic) {
        return res.status(404).json({
          success: false,
          message: "Topic not found",
        });
      }

      lessonQuery = { TopicId: topic._id };
    } else if (courseId) {
      const topics = await Topic.find({ courseId }).select("_id");

      lessonQuery = {
        TopicId: { $in: topics.map((topic) => topic._id) },
      };
    } else {
      return res.status(400).json({
        success: false,
        message: "Course ID or topic ID is required",
      });
    }

    const lessons = await Lesson.find(lessonQuery).sort({
      LessonNumber: 1,
    });

    if (lessons.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No lessons found",
      });
    }

    return res.status(200).json({
      success: true,
      lessons,
    });
  } catch (error) {
    console.error("GET LESSONS ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID or topic ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};