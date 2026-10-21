
const { ValidateLesson } = require('../../middlewares/Admin/validateLesson');
const Course = require('../../modules/CourseModuels/Courses');
const Lesson = require('../../modules/CourseModuels/LessonSchema');
const Topic = require('../../modules/CourseModuels/TopicsSchema')

exports.CreateLesson = async (req, res) => {
    try {

        const {
            courseId,
            title,
            lessonNumber,

        } = req.body;


        const { error } = ValidateLesson.validate({
            courseId,
            title,
            lessonNumber,
        });


        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }


        const existingCourse = await Course.findById(courseId);


        if (!existingCourse) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }


        const lesson = new Lesson({
            courseId,
            title,
            lessonNumber,
        });


        await lesson.save();


        return res.status(201).json({
            success: true,
            message: "Lesson created successfully",
            lesson
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


exports.GetLessons = async (req, res) => {
    try {
        const lessons = await Lesson.find().sort({
            lessonNumber: 1
        });

        return res.status(200).json({
            success: true,
            lessons
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


exports.GetCourses = async (req, res) => {
    try {
        const courses = await Course.find().sort({
            courseTitle: 1
        });

        return res.status(200).json({
            success: true,
            courses
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};



exports.GetLessonsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        const existingCourse = await Course.findById(courseId);

        if (!existingCourse) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        const lessons = await Lesson.find({ courseId }).sort({
            lessonNumber: 1
        });

        return res.status(200).json({
            success: true,
            lessons
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching lessons"
        });
    }
};


exports.UpdateLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;

        const existingLesson = await Lesson.findById(lessonId);

        if (!existingLesson) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found"
            });
        }

        const updatedData = {
            courseId: req.body.courseId ?? existingLesson.courseId,
            title: req.body.title ?? existingLesson.title,
            lessonNumber: req.body.lessonNumber ?? existingLesson.lessonNumber,
            videoUrl: req.body.videoUrl ?? existingLesson.videoUrl,
            material: req.body.material ?? existingLesson.material,
            content: req.body.content ?? existingLesson.content
        };

        const { error, value } = ValidateLesson.validate(updatedData);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const existingCourse = await Course.findById(value.courseId);

        if (!existingCourse) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        existingLesson.set(value);

        await existingLesson.save();

        return res.status(200).json({
            success: true,
            message: "Lesson updated successfully",
            lesson: existingLesson
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating lesson"
        });
    }
};


exports.DeleteLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;

        const existingLesson = await Lesson.findById(lessonId);

        if (!existingLesson) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found"
            });
        }



        const existingTopics = await Topic.exists({
            lessonId: existingLesson._id
        });

        if (existingTopics) {
            return res.status(409).json({
                success: false,
                message: "Cannot delete this lesson because it contains topics. Delete or move its topics first."
            });
        }

        await existingLesson.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Lesson deleted successfully"
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Server error while deleting lesson"
        });
    }
};





