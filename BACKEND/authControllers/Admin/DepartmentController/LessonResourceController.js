const Lesson = require("../../../modules/CourseModuels/LessonSchema")
const lessonResource = require("../../../modules/lessonVideoSchema")

exports.addResourceToLesson = async ( req, res ) => {
    try {
        const { lessonId } = req.params;

        const { type, title, url } = req.body

        if (!mongoose.isValidObjectId(lessonId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid lesson ID"
            });
        }

        if (!type || !title || !url) {
            return res.status(400).json({
                success: false,
                message: "Type, title and URL are required"
            });
        }


        const resource = await lessonResource.create({
            lessonId,
            title,
            type,
            url
        });

        res.status(200).json({  
            success: true, message: `Resource added Successfully: ${resource}`
        })


    } catch (error) {
        consolo.log(error)
    }
}