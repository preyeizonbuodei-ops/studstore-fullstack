
const mongoose = require("mongoose");
const majorAreaTopicValidation = require("../../../middlewares/Admin/ValidateMajorTopics");
const MajorAreaTopic = require("../../../modules/DepartmentModule/MajorTopicSchema");

// Create Major Area Topic
const createMajorAreaTopic = async (req, res) => {
  try {
    const { error, value } = majorAreaTopicValidation.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const existingTopic = await MajorAreaTopic.findOne({
      majorArea: value.majorArea,
      title: value.title,
    });

    if (existingTopic) {
      return res.status(409).json({
        success: false,
        message: "This topic already exists in this major area",
      });
    }

    const topic = await MajorAreaTopic.create(value);

    return res.status(201).json({
      success: true,
      message: "Topic created successfully",
      topic,
    });
  } catch (error) {
    console.error("CREATE MAJOR AREA TOPIC ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create major area topic",
    });
  }
};

// Get All Major Area Topics
const getAllMajorAreaTopics = async (req, res) => {
  try {
    const topics = await MajorAreaTopic.find()
      .populate({
        path: "majorArea",
        select: "name department",
        populate: {
          path: "department",
          select: "name",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      topics,
    });
  } catch (error) {
    console.error("GET MAJOR AREA TOPICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch major area topics",
    });
  }
};

// Get One Major Area Topic By ID
const getMajorAreaTopicById = async (req, res) => {
  try {
    const { majorTopicId } = req.params;

    if (!mongoose.isValidObjectId(majorTopicId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid topic ID",
      });
    }

    const topic = await MajorAreaTopic.findById(majorTopicId)
      .populate("majorArea", "name");

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    return res.status(200).json({
      success: true,
      topic,
    });
  } catch (error) {
    console.error("GET MAJOR AREA TOPIC ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch major area topic",
    });
  }
};

// Update Major Area Topic
const updateMajorAreaTopic = async (req, res) => {
  try {
    const { majorTopicId } = req.params;

    if (!mongoose.isValidObjectId(majorTopicId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid topic ID",
      });
    }

    const existingTopic = await MajorAreaTopic.findById(majorTopicId);

    if (!existingTopic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    // Keep the existing major area unless a new one is supplied.
    const updatedData = {
      ...existingTopic.toObject(),
      ...req.body,
      majorArea: req.body.majorArea ?? existingTopic.majorArea,
    };

    // Validate the complete updated topic.
    const { error, value } = majorAreaTopicValidation.validate(updatedData);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Exclude the current topic when checking for duplicate titles.
    const duplicateTopic = await MajorAreaTopic.findOne({
      _id: { $ne: majorTopicId },
      majorArea: value.majorArea,
      title: value.title,
    });

    if (duplicateTopic) {
      return res.status(409).json({
        success: false,
        message: "This topic already exists in this major area",
      });
    }

    // Update only fields accepted by the validation schema.
    existingTopic.set(value);
    await existingTopic.save();

    const updatedTopic = await MajorAreaTopic.findById(majorTopicId)
      .populate({
        path: "majorArea",
        select: "name department",
        populate: {
          path: "department",
          select: "name",
        },
      });

    return res.status(200).json({
      success: true,
      message: "Major area topic updated successfully",
      topic: updatedTopic,
    });
  } catch (error) {
    console.error("UPDATE MAJOR AREA TOPIC ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update major area topic",
    });
  }
};

// Delete Major Area Topic
const deleteMajorAreaTopic = async (req, res) => {
  try {
    const { majorTopicId } = req.params;

    if (!mongoose.isValidObjectId(majorTopicId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid topic ID",
      });
    }

    const deletedTopic = await MajorAreaTopic.findByIdAndDelete(
      majorTopicId
    );

    if (!deletedTopic) {
      return res.status(404).json({
        success: false,
        message: "Topic not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Major area topic deleted successfully",
      topic: deletedTopic,
    });
  } catch (error) {
    console.error("DELETE MAJOR AREA TOPIC ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete major area topic",
    });
  }
};

module.exports = {
  createMajorAreaTopic,
  getAllMajorAreaTopics,
  getMajorAreaTopicById,
  updateMajorAreaTopic,
  deleteMajorAreaTopic,
};
