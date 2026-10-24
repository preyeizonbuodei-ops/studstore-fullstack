const Joi = require("joi");

const ValidateTopic = Joi.object({
    courseId: Joi.string()
        .trim()
        .required()
        .messages({
            "string.empty": "Course ID is required",
            "any.required": "Course ID is required",
        }),

    title: Joi.string()
        .trim()
        .min(2)
        .required()
        .messages({
            "string.empty": "Topic title is required",
            "string.min": "Topic title must be at least 2 characters",
            "any.required": "Topic title is required",
        }),

    topicNumber: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            "number.base": "Topic number must be a number",
            "number.integer": "Topic number must be an integer",
            "number.positive": "Topic number must be greater than 0",
            "any.required": "Topic number is required",
        }),
});

module.exports = ValidateTopic;