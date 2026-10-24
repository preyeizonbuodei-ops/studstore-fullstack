
const Topic = require("../../modules/CourseModuels/TopicSchema");

// Get all topics belonging to a course
exports.GetTopicsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required.",
      });
    }

    const topics = await Topic.find({ courseId }).sort({
      TopicNumber: 1,
    });

    return res.status(200).json({
      success: true,
      message: "Topics retrieved successfully.",
      topics,
    });
  } catch (error) {
    console.error("GET TOPICS BY COURSE ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// Get one topic by ID
exports.GetTopicById = async (req, res) => {
  try {
    const { topicId } = req.params;

    const topic = await Topic.findById(topicId);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Topic retrieved successfully.",
      topic,
    });
  } catch (error) {
    console.error("GET TOPIC BY ID ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid topic ID.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
