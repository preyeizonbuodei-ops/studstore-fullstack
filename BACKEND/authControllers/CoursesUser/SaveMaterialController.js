
const User = require("../../modules/registerSchema");
const Lesson = require("../../modules/CourseModuels/LessonSchema");
const SavedMaterial = require("../../modules/CourseModuels/SaveMaterialSchema");
const Topic = require("../../modules/CourseModuels/TopicSchema");


exports.SaveMaterial = async (req, res) => {
    try {
        const studentId = req.user.id;

        const {
            topicId,
            title,
            url,
            resourceType = "material",
        } = req.body;

        // Validate required fields
        if (!topicId || !title || !url) {
            return res.status(400).json({
                success: false,
                message: "Topic ID, title, and URL are required.",
            });
        }

        // Validate resource type
        const allowedTypes = ["material", "video", "resource"];

        if (!allowedTypes.includes(resourceType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid resource type.",
            });
        }

        // Confirm that the student exists
        const student = await User.findById(studentId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student account not found.",
            });
        }

        // Confirm that the topic exists
        const topic = await Topic.findById(topicId);

        if (!topic) {
            return res.status(404).json({
                success: false,
                message: "Topic not found.",
            });
        }

        // Ensure the supplied URL belongs to a resource
        // actually attached to this topic.
        const topicResources = [
            ...(Array.isArray(topic.materials) ? topic.materials : []),
            ...(Array.isArray(topic.resources) ? topic.resources : []),
            ...(Array.isArray(topic.videos) ? topic.videos : []),
            ...(Array.isArray(topic.studyMaterials) ? topic.studyMaterials : []),
            ...(Array.isArray(topic.externalMaterials) ? topic.externalMaterials : []),
        ];

        const resourceExists = topicResources.some((resource) => {
            const resourceUrl =
                typeof resource === "string"
                    ? resource
                    : resource?.url ||
                      resource?.link ||
                      resource?.videoUrl ||
                      resource?.fileUrl;

            return resourceUrl === url;
        });

        if (!resourceExists) {
            return res.status(400).json({
                success: false,
                message: "This resource does not belong to the selected topic.",
            });
        }

        // Prevent duplicate saves
        const existingMaterial = await SavedMaterial.findOne({
            studentId,
            topicId,
            url,
        });

        if (existingMaterial) {
            return res.status(409).json({
                success: false,
                message: "You have already saved this material.",
                savedMaterial: existingMaterial,
            });
        }

        // Save material
        const savedMaterial = await SavedMaterial.create({
            studentId,
            topicId,
            title: title.trim(),
            url: url.trim(),
            resourceType,
        });

        return res.status(201).json({
            success: true,
            message: "Material saved successfully.",
            savedMaterial,
        });
    } catch (error) {
        console.error("SAVE MATERIAL ERROR:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid ID supplied.",
            });
        }

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This material has already been saved.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};



exports.GetSavedMaterials = async (req, res) => {
    try {
        const studentId = req.user.id;

        const savedMaterials = await SavedMaterial.find({
            studentId,
        })
            .populate("topicId", "title topicNumber lessonId")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Saved materials retrieved successfully.",
            count: savedMaterials.length,
            savedMaterials,
        });
    } catch (error) {
        console.error("GET SAVED MATERIALS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};


exports.DeleteSavedMaterial = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { materialId } = req.params;

        const savedMaterial = await SavedMaterial.findOneAndDelete({
            _id: materialId,
            studentId,
        });

        if (!savedMaterial) {
            return res.status(404).json({
                success: false,
                message: "Saved material not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Saved material removed successfully.",
            savedMaterial,
        });
    } catch (error) {
        console.error("DELETE SAVED MATERIAL ERROR:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid saved material ID.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};
