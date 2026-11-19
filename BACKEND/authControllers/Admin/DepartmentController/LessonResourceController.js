
const mongoose = require("mongoose");

const Topic = require("../../../modules/CourseModuels/TopicSchema");
const LessonResource = require("../../../modules/lessonVideoSchema");


exports.addResourceToLesson = async (req, res) => {
    try {
        const { topicId } = req.params;
        const { type, title, url } = req.body;

        // Validate Topic ID
        if (!mongoose.isValidObjectId(topicId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Topic ID"
            });
        }

        // Validate required fields
        if (!type || !title || !url) {
            return res.status(400).json({
                success: false,
                message: "Type, title and URL are required"
            });
        }

        // Validate resource type
        const allowedTypes = [
            "video",
            "pdf",
            "material",
            "resource",
            "example"
        ];

        if (!allowedTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid resource type"
            });
        }

        // Confirm that the Topic exists
        const topic = await Topic.findById(topicId);

        if (!topic) {
            return res.status(404).json({
                success: false,
                message: "Topic not found"
            });
        }

        // Save one independent resource
        const resource = await LessonResource.create({
            TopicId: topicId,
            type,
            title,
            url
        });

        return res.status(200).json({
            success: true,
            message: "Resource added successfully",
            resource
        });

    } catch (error) {
        console.error("Add Resource Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add resource",
            error: error.message
        });
    }
};


exports.GetAllMaterials = async ( req, res ) => {
    try {
        const Material = await lessonResource.find()

        if(!Material) {
            return res.stautus(404).json({ success: false, message: "no Material was found" })
        }

        res.status(200).json({ success: true, material: Material, message: "Materials retrievd successfully" })

    } catch (error) {
        
        console.error("GET LESSONS ERROR:", error);
    
            return res.status(500).json({
                success: false,
                message: "Server error while fetching lessons",
            });
    }
}