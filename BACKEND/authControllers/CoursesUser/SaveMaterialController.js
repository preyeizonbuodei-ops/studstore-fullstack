
const User = require("../../modules/registerSchema");
const Lesson = require("../../modules/CourseModuels/LessonSchema");
const SavedMaterial = require("../../modules/CourseModuels/SaveMaterialSchema");
const Topic = require("../../modules/CourseModuels/TopicSchema");

const ALLOWED_RESOURCE_TYPES = ["material", "video", "resource"];

const RESOURCE_FIELDS = [
    "material",
    "materials",
    "resource",
    "resources",
    "video",
    "videos",
    "videoUrl",
    "videoURL",
    "materialUrl",
    "materialURL",
    "fileUrl",
    "fileURL",
    "pdfUrl",
    "pdfURL",
    "studyMaterials",
    "externalMaterials",
    "externalResources",
    "links",
    "attachments",
    "documents",
];

const normalizeResourceUrl = (value) => {
    if (typeof value !== "string") return "";

    const cleaned = value.trim();

    if (!cleaned) return "";

    try {
        const parsed = new URL(cleaned);

        // Remove URL fragments because they do not identify a different resource.
        parsed.hash = "";

        return parsed.href.replace(/\/$/, "");
    } catch {
        return cleaned.replace(/\/+$/, "");
    }
};

// Recursively extract URLs from resource strings, arrays, and objects.
const collectResourceUrls = (value, urls = new Set()) => {
    if (typeof value === "string") {
        const cleaned = value.trim();

        if (!cleaned) return urls;

        // Handle a field whose entire value is a URL.
        const normalized = normalizeResourceUrl(cleaned);

        if (
            normalized &&
            /^https?:\/\//i.test(cleaned)
        ) {
            urls.add(normalized);
        }

        // Also handle text or resource objects containing embedded URLs.
        const matches =
            cleaned.match(/https?:\/\/[^\s"'<>]+/gi) || [];

        for (const match of matches) {
            const candidate = match.replace(/[),.;\]}]+$/, "");
            const normalizedMatch = normalizeResourceUrl(candidate);

            if (normalizedMatch) {
                urls.add(normalizedMatch);
            }
        }

        return urls;
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            collectResourceUrls(item, urls);
        }

        return urls;
    }

    if (value && typeof value === "object") {
        for (const item of Object.values(value)) {
            collectResourceUrls(item, urls);
        }
    }

    return urls;
};

// Only inspect fields likely to contain learning resources.
const getDocumentResourceUrls = (document) => {
    const urls = new Set();

    if (!document) return urls;

    for (const field of RESOURCE_FIELDS) {
        collectResourceUrls(document[field], urls);
    }

    return urls;
};

// Find the topic relationship field defined in the Lesson schema.
// Your current setup has been described as using TopicId.
const getLessonTopicField = () => {
    const possibleFields = [
        "TopicId",
        "topicId",
        "topicID",
        "topic",
    ];

    return possibleFields.find((field) =>
        Lesson.schema.path(field)
    );
};

const getLessonsForTopic = async (topicId) => {
    const relationshipField = getLessonTopicField();

    if (!relationshipField) {
        console.warn(
            "Could not identify the topic relationship field in LessonSchema."
        );

        return [];
    }

    return Lesson.find({
        [relationshipField]: topicId,
    }).lean();
};

// Save a material, video, or resource for a student.
exports.SaveMaterial = async (req, res) => {
    try {
        const studentId = req.user?.id || req.user?._id;

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: "Please log in to save materials.",
            });
        }

        const {
            topicId: rawTopicId,
            title,
            url,
            resourceType = "material",
        } = req.body || {};

        // Accept either a topic ID or a populated topic object.
        const topicId =
            rawTopicId && typeof rawTopicId === "object"
                ? rawTopicId._id
                : rawTopicId;

        if (!topicId || !title?.trim() || !url?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Topic ID, material title, and URL are required.",
            });
        }

        if (!ALLOWED_RESOURCE_TYPES.includes(resourceType)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid resource type. Use material, video, or resource.",
            });
        }

        const cleanTitle = title.trim();
        const cleanUrl = url.trim();
        const normalizedRequestedUrl =
            normalizeResourceUrl(cleanUrl);

        if (!normalizedRequestedUrl) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid resource URL.",
            });
        }

        // Confirm that the student exists.
        const student = await User.findById(studentId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student account not found.",
            });
        }

        // Confirm that the selected topic exists.
        const topic = await Topic.findById(topicId);

        if (!topic) {
            return res.status(404).json({
                success: false,
                message: "The selected topic was not found.",
            });
        }

        // Collect resource URLs stored directly on the topic.
        const availableUrls = getDocumentResourceUrls(
            topic.toObject()
        );

        // Also inspect lessons associated with the selected topic.
        const topicLessons = await getLessonsForTopic(topic._id);

        for (const lesson of topicLessons) {
            const lessonUrls = getDocumentResourceUrls(lesson);

            for (const lessonUrl of lessonUrls) {
                availableUrls.add(lessonUrl);
            }
        }

        // Ensure the requested resource is associated with this topic
        // or one of its lessons.
        if (!availableUrls.has(normalizedRequestedUrl)) {
            return res.status(400).json({
                success: false,
                message:
                    "This resource could not be found under the selected topic or its lessons. Please reopen the resource and try again.",
            });
        }

        // Prevent the same student from saving the same URL twice
        // for the same topic.
        const existingMaterial = await SavedMaterial.findOne({
            studentId,
            topicId: topic._id,
            url: cleanUrl,
        });

        if (existingMaterial) {
            return res.status(409).json({
                success: false,
                message: "This material is already saved.",
                savedMaterial: existingMaterial,
            });
        }

        const savedMaterial = await SavedMaterial.create({
            studentId,
            topicId: topic._id,
            title: cleanTitle,
            url: cleanUrl,
            resourceType,
        });

        return res.status(201).json({
            success: true,
            message: "Material saved successfully.",
            savedMaterial,
        });
    } catch (error) {
        // Handle a duplicate-key error from the schema's unique index.
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This material is already saved.",
            });
        }

        console.error("SaveMaterial error:", error);

        return res.status(500).json({
            success: false,
            message: "An error occurred while saving the material.",
        });
    }
};

// Fetch the logged-in student's saved materials.
exports.GetSavedMaterials = async (req, res) => {
    try {
        const studentId = req.user?.id || req.user?._id;

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: "Please log in to view saved materials.",
            });
        }

        const savedMaterials = await SavedMaterial.find({
            studentId,
        })
            .populate({
                path: "topicId",
                select: "title topicNumber TopicNumber lessonId",
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: savedMaterials.length,
            savedMaterials,
        });
    } catch (error) {
        console.error("GetSavedMaterials error:", error);

        return res.status(500).json({
            success: false,
            message: "An error occurred while fetching saved materials.",
        });
    }
};

// Delete one saved material belonging to the logged-in student.
exports.DeleteSavedMaterial = async (req, res) => {
    try {
        const studentId = req.user?.id || req.user?._id;
        const { materialId } = req.params;

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: "Please log in to remove saved materials.",
            });
        }

        if (!materialId) {
            return res.status(400).json({
                success: false,
                message: "Saved material ID is required.",
            });
        }

        const deletedMaterial =
            await SavedMaterial.findOneAndDelete({
                _id: materialId,
                studentId,
            });

        if (!deletedMaterial) {
            return res.status(404).json({
                success: false,
                message:
                    "Saved material not found or you do not have permission to delete it.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Material removed successfully.",
            deletedMaterialId: deletedMaterial._id,
        });
    } catch (error) {
        console.error("DeleteSavedMaterial error:", error);

        return res.status(500).json({
            success: false,
            message: "An error occurred while removing the saved material.",
        });
    }
};
