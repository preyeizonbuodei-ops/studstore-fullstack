const mongoose = require("mongoose");
const Exam = require("../../modules/CourseModuels/Exam");
const Course = require("../../modules/CourseModuels/Courses");
const Topic = require("../../modules/CourseModuels/TopicSchema");


// Create a new exam
exports.CreateExam = async (req, res) => {
  try {
    const {
      title,
      description,
      courseId,
      topicId,
      examMode,
      duration,
      instructions
    } = req.body;

    if (!title || !courseId || !examMode) {
      return res.status(400).json({
        success: false,
        message: "Title, course, and exam mode are required."
      });
    }

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID."
      });
    }

    if (!["practice", "cbt"].includes(examMode)) {
      return res.status(400).json({
        success: false,
        message: "Exam mode must be practice or cbt."
      });
    }

    if (
      examMode === "cbt" &&
      (!Number.isInteger(Number(duration)) || Number(duration) < 1)
    ) {
      return res.status(400).json({
        success: false,
        message: "A timed CBT exam must have a duration of at least 1 minute."
      });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found."
      });
    }

    let validatedTopicId = null;

    if (topicId) {
      if (!mongoose.isValidObjectId(topicId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid topic ID."
        });
      }

      const topic = await Topic.findOne({
        _id: topicId,
        courseId
      });

      if (!topic) {
        return res.status(400).json({
          success: false,
          message: "The selected topic does not belong to this course."
        });
      }

      validatedTopicId = topic._id;
    }

    if (!req.admin || !mongoose.isValidObjectId(req.admin.id)) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication is invalid."
      });
    }

    const exam = await Exam.create({
      title: title.trim(),
      description,
      courseId,
      topicId: validatedTopicId,
      examMode,
      duration: examMode === "cbt" ? Number(duration) : undefined,
      instructions,
      status: "draft",
      createdBy: req.admin.id
    });

    return res.status(201).json({
      success: true,
      message: "Exam created successfully as a draft.",
      exam
    });
  } catch (error) {
    console.error("CREATE EXAM ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create exam.",
      error: error.message
    });
  }
};

// Get all exams for admin management
exports.GetExams = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      if (!["draft", "published", "archived"].includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid exam status."
        });
      }

      filter.status = req.query.status;
    }

    if (req.query.courseId) {
      if (!mongoose.isValidObjectId(req.query.courseId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid course ID."
        });
      }

      filter.courseId = req.query.courseId;
    }

    const exams = await Exam.find(filter)
      .populate("courseId", "courseCode courseTitle")
      .populate("topicId", "title TopicNumber")
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: exams.length,
      exams
    });
  } catch (error) {
    console.error("GET EXAMS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve exams."
    });
  }
};

// Get one exam
exports.GetExamById = async (req, res) => {
  try {
    const { examId } = req.params;

    if (!mongoose.isValidObjectId(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID."
      });
    }

    const exam = await Exam.findById(examId)
      .populate("courseId", "courseCode courseTitle")
      .populate("topicId", "title TopicNumber")
      .populate("createdBy", "username email");

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found."
      });
    }

    return res.status(200).json({
      success: true,
      exam
    });
  } catch (error) {
    console.error("GET EXAM ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve exam."
    });
  }
};

// Update exam details
exports.UpdateExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const {
      title,
      description,
      courseId,
      topicId,
      examMode,
      duration,
      instructions
    } = req.body;

    if (!mongoose.isValidObjectId(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID."
      });
    }

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found."
      });
    }

    if (exam.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft exams can be edited. Unpublish or archive handling must be implemented separately."
      });
    }

    const nextCourseId = courseId || exam.courseId.toString();
    const nextTopicId =
      topicId === undefined ? exam.topicId?.toString() || null : topicId;

    const nextExamMode = examMode || exam.examMode;
    const nextDuration =
      duration === undefined ? exam.duration : Number(duration);

    if (!mongoose.isValidObjectId(nextCourseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID."
      });
    }

    if (!["practice", "cbt"].includes(nextExamMode)) {
      return res.status(400).json({
        success: false,
        message: "Exam mode must be practice or cbt."
      });
    }

    if (
      nextExamMode === "cbt" &&
      (!Number.isInteger(nextDuration) || nextDuration < 1)
    ) {
      return res.status(400).json({
        success: false,
        message: "A timed CBT exam must have a duration of at least 1 minute."
      });
    }

    const course = await Course.findById(nextCourseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found."
      });
    }

    let validatedTopicId = null;

    if (nextTopicId) {
      if (!mongoose.isValidObjectId(nextTopicId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid topic ID."
        });
      }

      const topic = await Topic.findOne({
        _id: nextTopicId,
        courseId: nextCourseId
      });

      if (!topic) {
        return res.status(400).json({
          success: false,
          message: "The selected topic does not belong to this course."
        });
      }

      validatedTopicId = topic._id;
    }

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Exam title cannot be empty."
        });
      }

      exam.title = title.trim();
    }

    if (description !== undefined) exam.description = description;
    if (instructions !== undefined) exam.instructions = instructions;

    exam.courseId = nextCourseId;
    exam.topicId = validatedTopicId;
    exam.examMode = nextExamMode;
    exam.duration =
      nextExamMode === "cbt" ? nextDuration : undefined;

    await exam.save();

    return res.status(200).json({
      success: true,
      message: "Exam updated successfully.",
      exam
    });
  } catch (error) {
    console.error("UPDATE EXAM ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update exam.",
      error: error.message
    });
  }
};

// Publish an exam
exports.PublishExam = async (req, res) => {
  try {
    const { examId } = req.params;

    if (!mongoose.isValidObjectId(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID."
      });
    }

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found."
      });
    }

    if (exam.status === "archived") {
      return res.status(400).json({
        success: false,
        message: "Archived exams cannot be published. Create a new exam instead."
      });
    }

    const ExamQuestion = require("../../modules/CourseModuels/ExamQuestion")

    const questionCount = await ExamQuestion.countDocuments({
        examId: exam._id,
        $or: [
            { questionSource: "manual" },
            { questionSource: "past_question" },
            { questionSource: "ai", reviewStatus: "approved" }
        ]
    });

    if (questionCount === 0) {
      return res.status(400).json({
        success: false,
        message: "Add at least one manual question or an approved AI-generated question before publishing."
      });
    }

    exam.status = "published";
    exam.publishedAt = new Date();

    await exam.save();

    return res.status(200).json({
      success: true,
      message: "Exam published successfully.",
      exam
    });
  } catch (error) {
    console.error("PUBLISH EXAM ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to publish exam."
    });
  }
};

// Archive an exam
exports.ArchiveExam = async (req, res) => {
  try {
    const { examId } = req.params;

    if (!mongoose.isValidObjectId(examId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID."
      });
    }

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found."
      });
    }

    exam.status = "archived";
    await exam.save();

    return res.status(200).json({
      success: true,
      message: "Exam archived successfully.",
      exam
    });
  } catch (error) {
    console.error("ARCHIVE EXAM ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to archive exam."
    });
  }
};
