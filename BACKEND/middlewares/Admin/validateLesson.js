const Joi = require("joi");

const ValidateLesson = Joi.object({
    topicId: Joi.string()
        .trim()
        .required()
        .messages({
            "string.empty": "Topic ID is required",
            "any.required": "Topic ID is required",
        }),

    lessonNumber: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            "number.base": "Lesson number must be a number",
            "number.integer": "Lesson number must be an integer",
            "number.positive": "Lesson number must be greater than 0",
            "any.required": "Lesson number is required",
        }),

    title: Joi.string()
        .trim()
        .min(2)
        .required()
        .messages({
            "string.empty": "Lesson title is required",
            "string.min": "Lesson title must be at least 2 characters",
            "any.required": "Lesson title is required",
        }),

    content: Joi.string()
        .required()
        .messages({
            "string.empty": "Lesson content is required",
            "any.required": "Lesson content is required",
        }),

    examples: Joi.string()
        .allow("")
        .optional(),

    videos: Joi.array()
        .items(
            Joi.object({
                title: Joi.string().trim().required(),
                url: Joi.string().uri().required(),
            })
        )
        .optional(),

    materials: Joi.array()
        .items(
            Joi.object({
                title: Joi.string().trim().required(),
                url: Joi.string().uri().required(),
            })
        )
        .optional(),

    resources: Joi.array()
        .items(
            Joi.object({
                title: Joi.string().trim().required(),
                url: Joi.string().uri().required(),
            })
        )
        .optional(),
});

module.exports = ValidateLesson;